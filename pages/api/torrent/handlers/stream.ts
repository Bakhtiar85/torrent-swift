// pages/api/torrent/handlers/stream.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { TaskInfo } from '@/types';
import { cache, client, torrentBuffers } from '@/pages/config/torrent.config';
import { getMimeType } from '@/pages/utils/torrent.utils';
import { recoverTorrent } from '@/pages/services/torrent.service';
import { apiResponse } from '@/pages/utils/response.utils';

export const streamFile = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { infoHash, fileIndex } = req.query;

    if (!infoHash || typeof infoHash !== 'string' || !fileIndex || typeof fileIndex !== 'string') {
        return apiResponse(res, {
            success: false,
            statusCode: 400,
            message: 'Invalid infoHash or fileIndex',
            error: 'Invalid infoHash or fileIndex',
        });
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
                return apiResponse(res, {
                    success: false,
                    statusCode: 404,
                    message: 'Task not found and recovery failed',
                    error: 'Task not found and recovery failed',
                });
            }
            task = recoveredTask;
        } else {
            return apiResponse(res, {
                success: false,
                statusCode: 404,
                message: 'Task not found and no recovery possible',
                error: 'Task not found and no recovery possible',
            });
        }
    }

    let torrent = await client.get(task.infoHash);
    if (!torrent) {
        if (torrentBuffers.has(infoHash)) {
            console.log('Attempting to recover torrent from stored buffer');
            await recoverTorrent(infoHash, torrentBuffers.get(infoHash)!);
            torrent = await client.get(task.infoHash);
            if (!torrent) {
                return apiResponse(res, {
                    success: false,
                    statusCode: 404,
                    message: 'Torrent not found and recovery failed',
                    error: 'Torrent not found and recovery failed',
                });
            }
        } else {
            return apiResponse(res, {
                success: false,
                statusCode: 404,
                message: 'Torrent not found and no recovery possible',
                error: 'Torrent not found and no recovery possible',
            });
        }
    }

    const fileIdx = parseInt(fileIndex, 10);
    if (isNaN(fileIdx) || fileIdx < 0 || fileIdx >= torrent.files.length) {
        return apiResponse(res, {
            success: false,
            statusCode: 400,
            message: 'Invalid file index',
            error: `File index must be between 0 and ${torrent.files.length - 1}`,
        });
    }

    const file = torrent.files[fileIdx];
    if (!file) {
        return apiResponse(res, {
            success: false,
            statusCode: 404,
            message: 'File not found in torrent',
            error: 'File not found in torrent',
        });
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
            // if (file.progress === 1) {
            //     cleanupTorrent(task.infoHash);
            // }
        });
    } catch (error) {
        console.error('handlers/stream.ts::133 error:', error);
        return apiResponse(res, {
            success: false,
            statusCode: 500,
            message: 'Streaming error',
            error: error instanceof Error ? error.message : 'Unknown streaming error',
        });
    }
};