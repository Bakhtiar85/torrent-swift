// pages/api/torrent/handlers/stream.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { TaskInfo } from '@/types';
import { cache, client, torrentBuffers } from '@/pages/config/torrent.config';
import { getMimeType } from '@/pages/utils/torrent.utils';
import { cleanupTorrent, recoverTorrent } from '@/pages/services/torrent.service';

export const streamFile = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { infoHash, fileIndex } = req.query;

    if (!infoHash || typeof infoHash !== 'string' || !fileIndex || typeof fileIndex !== 'string') {
        res.status(400).json({ error: 'Invalid infoHash or fileIndex' });
        return;
    }

    console.log(`Attempting to stream file. InfoHash: ${infoHash}, FileIndex: ${fileIndex}`);

    let task = cache.get(infoHash) as TaskInfo;
    if (!task) {
        console.log(`Task not found in cache: ${infoHash}`);
        if (torrentBuffers.has(infoHash)) {
            console.log('Attempting to recover torrent from stored buffer');
            await recoverTorrent(infoHash, torrentBuffers.get(infoHash)!);
            const recoveredTask = cache.get(infoHash) as TaskInfo;
            if (!recoveredTask) {
                res.status(404).json({ error: 'Task not found and recovery failed' });
                return;
            }
            task = recoveredTask;
        } else {
            res.status(404).json({ error: 'Task not found and no recovery possible' });
            return;
        }
    }

    let torrent = await client.get(task.infoHash);
    if (!torrent) {
        if (torrentBuffers.has(infoHash)) {
            console.log('Attempting to recover torrent from stored buffer');
            await recoverTorrent(infoHash, torrentBuffers.get(infoHash)!);
            torrent = await client.get(task.infoHash);
            if (!torrent) {
                res.status(404).json({ error: 'Torrent not found and recovery failed' });
                return;
            }
        } else {
            res.status(404).json({ error: 'Torrent not found and no recovery possible' });
            return;
        }
    }

    const fileIdx = parseInt(fileIndex, 10);
    if (isNaN(fileIdx) || fileIdx < 0 || fileIdx >= torrent.files.length) {
        res.status(400).json({
            error: 'Invalid file index',
            details: `File index must be between 0 and ${torrent.files.length - 1}`
        });
        return;
    }

    const file = torrent.files[fileIdx];
    if (!file) {
        res.status(404).json({ error: 'File not found in torrent' });
        return;
    }

    console.log(`Streaming file: ${file.name}, Size: ${file.length}`);

    try {
        const range = req.headers.range;
        const fileSize = file.length;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': getMimeType(file.name),
                'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
            });

            const stream = file.createReadStream({ start, end });
            stream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': getMimeType(file.name),
                'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
            });

            const stream = file.createReadStream();
            stream.pipe(res);
        }

        res.on('close', () => {
            console.log(`Stream closed for file: ${file.name}`);
            if (file.progress === 1) {
                cleanupTorrent(task.infoHash);
            }
        });
    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({
            error: 'Streaming error',
            details: error instanceof Error ? error.message : 'Unknown streaming error'
        });
    }
};