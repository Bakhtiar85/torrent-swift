import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import WebTorrent from 'webtorrent';
import NodeCache from 'node-cache';

const upload = multer();
const client = new WebTorrent();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache expires after 1 hour

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    console.log(`Received ${req.method} request to /api/torrent/stream`);
    if (req.method === 'POST') {
        await handleTorrentUpload(req, res);
    } else if (req.method === 'GET') {
        await handleProgressCheck(req, res);
    } else {
        res.status(405).end();
    }
}

async function handleTorrentUpload(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).end();
    }
    const taskId = Date.now().toString();

    console.log('Received POST request');

    upload.single('torrentFile')(req as any, res as any, async (err) => {
        if (err) {
            console.error('Error processing file upload:', err);
            return res.status(500).send('Error processing file upload');
        }

        const torrentFile = (req as any).file;
        if (!torrentFile) {
            console.error('No torrent file provided');
            return res.status(400).send('Please provide a valid torrent file.');
        }

        console.log('Torrent file received:', torrentFile.originalname);

        try {
            const torrent = client.add(torrentFile.buffer, { strategy: 'sequential' });

            console.log('Torrent added to client');

            torrent.on('ready', () => {
                console.log('Torrent ready event fired');

                cache.set(taskId, {
                    infoHash: torrent.infoHash,
                    name: torrent.name,
                    progress: 0,
                    totalBytes: 0,
                    totalSize: torrent.length
                });

                res.status(200).json({ taskId });

                const file = torrent.files[0];  // Assuming we're only handling the first file
                if (!file) {
                    console.error('No files found in torrent');
                    return;
                }

                console.log('Preparing to stream file:', file.name);

                let stream = file.createReadStream();
                let totalBytes = 0;

                stream.on('data', (chunk) => {
                    totalBytes += chunk.length;
                    const progress = (totalBytes / file.length * 100).toFixed(2);
                    console.log(`Streaming progress for task ${taskId}: ${totalBytes} / ${file.length} bytes ${progress}(%)`);

                    // Update the cached task info with the new progress
                    cache.set(taskId, {
                        infoHash: torrent.infoHash,
                        name: torrent.name,
                        progress: parseFloat(progress),
                        totalBytes: totalBytes,
                        totalSize: file.length
                    });
                });

                stream.on('end', () => {
                    console.log('Stream ended');
                    // Ensure progress is set to 100% when the stream ends
                    cache.set(taskId, {
                        infoHash: torrent.infoHash,
                        name: torrent.name,
                        progress: 100,
                        totalBytes: file.length,
                        totalSize: file.length
                    });
                });
            });

            torrent.on('error', (err) => {
                console.error('Torrent error:', err);
                cache.del(taskId);
            });
        } catch (error) {
            console.error('Error processing torrent:', error);
            res.status(500).send('Error processing torrent');
        }
    });
}

async function handleProgressCheck(req: NextApiRequest, res: NextApiResponse) {
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
        console.error('Invalid taskId provided');
        return res.status(400).json({ status: 'error', message: 'Invalid taskId' });
    }

    console.log(`Checking progress for taskId: ${taskId}`);

    const task: any = cache.get(taskId); // Retrieve the task from cache
    if (!task) {
        console.error(`Task not found for taskId: ${taskId}`);
        return res.status(404).json({ status: 'error', message: 'Task not found' });
    }

    const { progress, totalBytes, totalSize } = task;
    console.log(`Progress for taskId ${taskId}: ${progress}% (${totalBytes}/${totalSize} bytes)`);

    return res.status(200).json({ status: 'success', progress, totalBytes, totalSize });
}

export async function streamFile(req: NextApiRequest, res: NextApiResponse) {
    const { taskId, fileIndex } = req.query;

    if (!taskId || typeof taskId !== 'string' || !fileIndex || typeof fileIndex !== 'string') {
        return res.status(400).send('Invalid taskId or fileIndex');
    }

    const task: any = cache.get(taskId);
    if (!task) {
        return res.status(404).send('Task not found');
    }

    const torrent = client.get(task.infoHash);
    if (!torrent) {
        return res.status(404).send('Torrent not found');
    }

    const file = torrent.files[parseInt(fileIndex, 10)];
    if (!file) {
        return res.status(404).send('File not found');
    }

    res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
        'Transfer-Encoding': 'chunked',
    });

    const stream = file.createReadStream();
    stream.pipe(res);

    stream.on('end', () => {
        console.log('File stream ended');
        res.end();
    });
}