// pages/api/torrent/stream.ts
import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import * as WebTorrent from 'webtorrent';
import NodeCache from 'node-cache';

const upload = multer({ storage: multer.memoryStorage() });
// Increase cache TTL to 24 hours and check period to 600 seconds
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });
// Create a persistent WebTorrent client
const client = new (WebTorrent as any).default();

// Store torrent buffers for potential reuse
const torrentBuffers = new Map<string, Buffer>();

interface TorrentFile {
    name: string;
    length: number;
    downloaded: number;
    progress: number;
    path: string;
    mime?: string;
    streamReady: boolean;
}

interface TaskInfo {
    infoHash: string;
    name: string;
    files: TorrentFile[];
    progress: number;
    downloadedBytes: number;
    size: number;
    timeRemaining: number;
    downloadSpeed: number;
    status: 'queued' | 'downloading' | 'completed' | 'error';
}

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

const getMimeType = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
        'mp4': 'video/mp4',
        'mkv': 'video/x-matroska',
        'avi': 'video/x-msvideo',
        'mp3': 'audio/mpeg',
        'pdf': 'application/pdf',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'default': 'application/octet-stream'
    };
    return mimeTypes[extension || ''] || mimeTypes.default;
};

const getFileInfo = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { taskId, fileIndex } = req.query;

    if (!taskId || typeof taskId !== 'string') {
        res.status(400).json({ error: 'Invalid taskId' });
        return;
    }

    const task = cache.get(taskId) as TaskInfo;
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    if (fileIndex && typeof fileIndex === 'string') {
        const file = task.files[parseInt(fileIndex, 10)];
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        res.status(200).json({ file });
    } else {
        res.status(200).json({ task });
    }
};

const handleProgressCheck = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
        res.status(400).json({ error: 'Invalid taskId' });
        return;
    }

    const task = cache.get(taskId) as TaskInfo;
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    res.status(200).json({
        status: 'success',
        progress: task.progress,
        files: task.files
    });
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        console.log(`Received ${req.method} request to /api/torrent/stream`);
        console.log('Query params:', req.query);

        switch (req.method) {
            case 'POST':
                return await handleTorrentUpload(req, res);
            case 'GET':
                if (req.query.fileIndex !== undefined) {
                    return await streamFile(req, res);
                } else if (req.query.info !== undefined) {
                    return await getFileInfo(req, res);
                } else {
                    return await handleProgressCheck(req, res);
                }
            case 'DELETE':
                return await cancelTask(req, res); // Add this line
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API handler error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

const cancelTask = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
        res.status(400).json({ error: 'Invalid taskId' });
        return;
    }

    console.log(`Cancelling torrent download for task ${taskId}`);

    const task = cache.get(taskId) as TaskInfo;
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    // Try to retrieve the torrent from the client by its infoHash
    const torrent = await client.get(task.infoHash);
    if (!torrent) {
        res.status(404).json({ error: 'Torrent not found in client' });
        return;
    }

    try {
        // Properly destroy the torrent and clean up
        torrent.destroy({ destroyStore: true }, (err: any) => {
            if (err) {
                console.error('Error destroying torrent:', err);
                res.status(500).json({ error: 'Failed to cancel torrent download' });
                return;
            }

            // Remove task from cache and buffer store
            cache.del(taskId);
            torrentBuffers.delete(taskId);

            console.log(`Torrent for task ${taskId} successfully cancelled and cleaned up.`);
            res.status(200).json({ status: 'success', message: 'Torrent download cancelled' });
        });
    } catch (error) {
        console.error('Cancellation error:', error);
        res.status(500).json({
            error: 'Failed to cancel torrent download',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

const handleTorrentUpload = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    return new Promise((resolve) => {
        upload.single('torrentFile')(req as any, res as any, async (err: any) => {
            if (err) {
                console.error('Upload error:', err);
                res.status(500).json({ error: 'Error processing file upload' });
                return resolve();
            }

            const torrentFile = (req as any).file;
            if (!torrentFile) {
                res.status(400).json({ error: 'Please provide a valid torrent file.' });
                return resolve();
            }

            const taskId = Date.now().toString();
            console.log('Processing torrent:', torrentFile.originalname);

            try {
                // Store the torrent buffer for potential reuse
                torrentBuffers.set(taskId, torrentFile.buffer);

                client.add(torrentFile.buffer, {
                    announce: ['wss://tracker.openwebtorrent.com']
                }, (torrent: WebTorrent.Torrent) => {
                    console.log(`Torrent added with infoHash: ${torrent.infoHash}`);

                    const taskInfo: TaskInfo = {
                        infoHash: torrent.infoHash,
                        name: torrent.name,
                        files: torrent.files.map(file => ({
                            name: file.name,
                            length: file.length,
                            downloaded: 0,
                            progress: 0,
                            path: file.path,
                            mime: getMimeType(file.name),
                            streamReady: false
                        })),
                        progress: 0,
                        downloadedBytes: 0,
                        size: torrent.length,
                        timeRemaining: 0,
                        downloadSpeed: 0,
                        status: 'queued'
                    };

                    cache.set(taskId, taskInfo);
                    setupTorrentHandlers(torrent, taskId);

                    res.status(200).json({
                        taskId,
                        name: torrent.name,
                        files: taskInfo.files.map(file => ({
                            name: file.name,
                            size: formatBytes(file.length),
                            mime: file.mime
                        }))
                    });
                    resolve();
                });
            } catch (error) {
                console.error('Torrent processing error:', error);
                res.status(500).json({ error: 'Error processing torrent' });
                resolve();
            }
        });
    });
};

const streamFile = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { taskId, fileIndex } = req.query;

    if (!taskId || typeof taskId !== 'string' || !fileIndex || typeof fileIndex !== 'string') {
        res.status(400).json({ error: 'Invalid taskId or fileIndex' });
        return;
    }

    console.log(`Attempting to stream file. TaskID: ${taskId}, FileIndex: ${fileIndex}`);

    let task = cache.get(taskId) as TaskInfo;
    if (!task) {
        console.log(`Task not found in cache: ${taskId}`);
        // Try to recover the torrent if we have the buffer
        if (torrentBuffers.has(taskId)) {
            console.log('Attempting to recover torrent from stored buffer');
            await recoverTorrent(taskId, torrentBuffers.get(taskId)!);
            // Retry getting the task
            const recoveredTask = cache.get(taskId) as TaskInfo;
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
        console.log(`Torrent not found in client: ${task.infoHash}`);
        // Try to recover the torrent if we have the buffer
        if (torrentBuffers.has(taskId)) {
            console.log('Attempting to recover torrent from stored buffer');
            await recoverTorrent(taskId, torrentBuffers.get(taskId)!);
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

    console.log(`Streaming file: ${file.name}, Size: ${formatBytes(file.length)}`);

    const range = req.headers.range;
    const fileSize = file.length;

    try {
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

        // Clean up the torrent when download is complete
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

const recoverTorrent = async (taskId: string, buffer: Buffer): Promise<void> => {
    return new Promise((resolve, reject) => {
        try {
            client.add(buffer, {
                announce: ['wss://tracker.openwebtorrent.com']
            }, (torrent: WebTorrent.Torrent) => {
                const taskInfo: TaskInfo = {
                    infoHash: torrent.infoHash,
                    name: torrent.name,
                    files: torrent.files.map(file => ({
                        name: file.name,
                        length: file.length,
                        downloaded: 0,
                        progress: 0,
                        path: file.path,
                        mime: getMimeType(file.name),
                        streamReady: false
                    })),
                    progress: 0,
                    downloadedBytes: 0,
                    size: torrent.length,
                    timeRemaining: 0,
                    downloadSpeed: 0,
                    status: 'queued'
                };

                cache.set(taskId, taskInfo);
                setupTorrentHandlers(torrent, taskId);
                resolve();
            });
        } catch (error) {
            console.error('Recovery failed:', error);
            reject(error);
        }
    });
};

// Modified cleanup function
const cleanupTorrent = async (infoHash: string) => {
    try {
        const torrent = await client.get(infoHash);
        if (torrent) {
            console.log(`Cleaning up torrent: ${infoHash}`);
            torrent.destroy({ removeTorrent: true });
            // Find and remove the associated taskId from torrentBuffers
            torrentBuffers.forEach((_, taskId) => {
                const task = cache.get(taskId) as TaskInfo;
                if (task && task.infoHash === infoHash) {
                    torrentBuffers.delete(taskId);
                    return; // Exit the forEach loop early
                }
            });
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

const updateProgress = (torrent: WebTorrent.Torrent, taskId: string): void => {
    const taskInfo = cache.get(taskId) as TaskInfo;
    if (taskInfo) {
        taskInfo.downloadedBytes = torrent.downloaded;
        taskInfo.progress = torrent.progress * 100;
        taskInfo.downloadSpeed = torrent.downloadSpeed;
        taskInfo.timeRemaining = torrent.timeRemaining;
        taskInfo.status = torrent.progress === 1 ? 'completed' : 'downloading';

        // Update individual file progress
        taskInfo.files = torrent.files.map(file => ({
            name: file.name,
            length: file.length,
            downloaded: file.downloaded,
            progress: file.progress * 100,
            path: file.path,
            mime: getMimeType(file.name),
            streamReady: file.progress > 0.1 // Consider file ready for streaming at 10%
        }));

        cache.set(taskId, taskInfo);
    }
};

// Modify setupTorrentHandlers to include cleanup
const setupTorrentHandlers = (torrent: WebTorrent.Torrent, taskId: string): void => {
    const progressInterval = setInterval(() => {
        if (!cache.get(taskId)) {
            clearInterval(progressInterval);
            return;
        }
        updateProgress(torrent, taskId);
    }, 1000);

    torrent.on('done', () => {
        console.log(`Torrent download completed for task ${taskId}`);
        clearInterval(progressInterval);
        updateProgress(torrent, taskId);
    });

    torrent.on('error', (err) => {
        console.error(`Torrent error for task ${taskId}:`, err);
        const taskInfo = cache.get(taskId) as TaskInfo;
        if (taskInfo) {
            taskInfo.status = 'error';
            cache.set(taskId, taskInfo);
        }
        cleanupTorrent(torrent.infoHash);
    });
};

const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default handler;