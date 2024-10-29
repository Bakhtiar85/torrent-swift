import { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import * as WebTorrent from 'webtorrent';
import NodeCache from 'node-cache';

const upload = multer({ storage: multer.memoryStorage() });
const client = new (WebTorrent as any).default();
const cache = new NodeCache({ stdTTL: 3600 });

// Enhanced file information interface
interface TorrentFile {
    name: string;
    length: number;
    downloaded: number;
    progress: number;
    path: string;
    mime?: string;    // MIME type for the file
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
        // Add more mime types as needed
        'default': 'application/octet-stream'
    };
    return mimeTypes[extension || ''] || mimeTypes.default;
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        console.log(`Received ${req.method} request to /api/torrent/stream`);

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
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('API handler error:', error);
        return res.status(500).json({ error: 'Internal server error' });
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
                client.add(torrentFile.buffer, {
                    announce: ['wss://tracker.openwebtorrent.com'],
                    path: './.downloads' // Optional: save files to disk instead of keeping in memory
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

    const task = cache.get(taskId) as TaskInfo;
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    const torrent = client.get(task.infoHash);
    if (!torrent) {
        res.status(404).json({ error: 'Torrent not found' });
        return;
    }

    const file = torrent.files[parseInt(fileIndex, 10)];
    if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
    }

    const range = req.headers.range;
    const fileSize = file.length;

    if (range) {
        // Handle range requests for video streaming
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': getMimeType(file.name)
        });

        const stream = file.createReadStream({ start, end });
        stream.pipe(res);
    } else {
        // Handle normal file download
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': getMimeType(file.name),
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
        });

        const stream = file.createReadStream();
        stream.pipe(res);
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