import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import WebTorrent, { Torrent } from 'webtorrent';
import NodeCache from 'node-cache';

const upload = multer({ storage: multer.memoryStorage() });
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
        const { fileIndex } = req.query;
        if (fileIndex !== undefined) {
            await streamFile(req, res);
        } else {
            await handleProgressCheck(req, res);
        }
    } else {
        res.status(405).end();
    }
}

async function handleTorrentUpload(req: NextApiRequest, res: NextApiResponse) {
    upload.single('torrentFile')(req as any, res as any, async (err: any) => {
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

        const taskId = Date.now().toString();

        try {
            client.add(torrentFile.buffer, { announce: ['wss://tracker.openwebtorrent.com'] }, (torrent: Torrent) => {
                console.log('Torrent added to client');
                console.log(`Torrent name: ${torrent.name}`);
                console.log(`Number of files: ${torrent.files.length}`);

                const taskInfo = {
                    infoHash: torrent.infoHash,
                    name: torrent.name,
                    files: torrent.files.map(file => ({ name: file.name, length: file.length })),
                    progress: 0,
                    downloadedBytes: 0,
                };

                cache.set(taskId, taskInfo);

                res.status(200).json({ taskId });

                // Set up streams for each file
                torrent.files.forEach((file, index) => {
                    const stream = file.createReadStream();
                    stream.on('data', (chunk) => {
                        const updatedTaskInfo = cache.get(taskId) as typeof taskInfo;
                        if (updatedTaskInfo) {
                            updatedTaskInfo.downloadedBytes += chunk.length;
                            updatedTaskInfo.progress = (updatedTaskInfo.downloadedBytes / torrent.length * 100);
                            cache.set(taskId, updatedTaskInfo);
                        }
                        console.log(`File ${index + 1}: ${file.name} - Received chunk of ${chunk.length} bytes`);
                    });
                });

                // Set up interval for logging detailed progress
                const progressInterval = setInterval(() => {
                    const taskInfo: any = cache.get(taskId) as typeof taskInfo;
                    if (!taskInfo) {
                        clearInterval(progressInterval);
                        return;
                    }

                    console.log(`\n--- Progress Update for task ${taskId} ---`);
                    console.log(`Overall progress: ${taskInfo.progress.toFixed(2)}%`);
                    console.log(`Download speed: ${formatBytes(torrent.downloadSpeed)}/s`);
                    console.log(`Peers: ${torrent.numPeers}`);

                    torrent.files.forEach((file, index) => {
                        console.log(`File ${index + 1}: ${file.name} - ${(file.progress * 100).toFixed(2)}% (${formatBytes(file.downloaded)}/${formatBytes(file.length)})`);
                    });

                    console.log("-------------------\n");
                }, 5000); // Log every 5 seconds

                torrent.on('done', () => {
                    console.log(`Torrent download completed for task ${taskId}`);
                    clearInterval(progressInterval);
                    const updatedTaskInfo = cache.get(taskId) as typeof taskInfo;
                    if (updatedTaskInfo) {
                        cache.set(taskId, {
                            ...updatedTaskInfo,
                            progress: 100,
                        });
                    }
                });
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

    const task: any = cache.get(taskId);
    if (!task) {
        console.error(`Task not found for taskId: ${taskId}`);
        return res.status(404).json({ status: 'error', message: 'Task not found' });
    }

    const { progress, files } = task;
    console.log(`Progress for taskId ${taskId}: ${progress}%`);

    return res.status(200).json({ status: 'success', progress, files });
}

async function streamFile(req: NextApiRequest, res: NextApiResponse) {
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

function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}