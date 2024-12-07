// pages/api/torrent/handlers/upload.ts
import { NextApiResponse } from 'next';
import * as WebTorrent from 'webtorrent';
import { TaskInfo } from '@/types';
import { cache, client } from '@/pages/api/config/torrent.config';
import { setupTorrentHandlers } from '@/pages/api/services/torrent.service';
import { formatBytes, getMimeType, runMiddleware, upload } from '../../utils/torrent.utils';
import { apiResponse } from '../../utils/response.utils';

export const handleTorrentUpload = async (req: any, res: NextApiResponse) => {
    try {
        await runMiddleware(req, res, upload.single('torrentFile'));

        // Parse JSON body for magnet link
        let body: { magnetLink?: string } = {};
        if (!req.file) {
            body = await new Promise((resolve, reject) => {
                let json = '';
                req.on('data', (chunk: any) => (json += chunk));
                req.on('end', () => resolve(JSON.parse(json)));
                req.on('error', reject);
            });
        }

        const torrentFile = req.file;
        const magnetLink = body.magnetLink;

        if (!torrentFile && !magnetLink) {
            return apiResponse(res, {
                success: false,
                statusCode: 400,
                message: 'Invalid upload request',
                error: 'Please provide a torrent file or a magnet link',
            });
        }

        console.log(`Processing ${torrentFile ? 'file' : 'magnet link'}`);

        const torrentSource = torrentFile ? torrentFile.buffer : magnetLink;

        // Get infoHash without adding to client
        const tempTorrent = await new Promise<WebTorrent.Torrent>((resolve, reject) => {
            const temp = new (WebTorrent as any).default();
            temp.add(torrentSource, { announce: ['wss://tracker.openwebtorrent.com'] }, (torrent: WebTorrent.Torrent) => {
                resolve(torrent);
                setTimeout(() => {
                    torrent.destroy();
                    temp.destroy();
                }, 1000);
            });
        });

        const infoHash = tempTorrent.infoHash;

        // Check for existing task
        const existingTask = Array.from(cache.keys()).find(key => {
            const task = cache.get(key) as TaskInfo;
            return task && task.infoHash === infoHash;
        });

        if (existingTask) {
            const existingTaskInfo = cache.get(existingTask) as TaskInfo;
            return apiResponse(res, {
                success: true,
                statusCode: 200,
                message: 'Torrent already exists',
                data: {
                    infoHash,
                    name: existingTaskInfo.name,
                    files: existingTaskInfo.files,
                    status: 'already_exists',
                },
            });
        }

        // Add torrent to client
        client.add(torrentSource, { announce: ['wss://tracker.openwebtorrent.com'] }, (torrent: WebTorrent.Torrent) => {
            const taskInfo: TaskInfo = {
                infoHash: torrent.infoHash,
                name: torrent.name,
                files: torrent.files.map((file) => ({
                    name: file.name,
                    length: file.length,
                    downloaded: 0,
                    progress: 0,
                    path: file.path,
                    mime: getMimeType(file.name),
                    streamReady: false,
                })),
                progress: 0,
                downloadedBytes: 0,
                size: torrent.length,
                timeRemaining: 0,
                downloadSpeed: 0,
                status: 'queued',
            };

            cache.set(infoHash, taskInfo);
            setupTorrentHandlers(torrent, infoHash);

            return apiResponse(res, {
                success: true,
                statusCode: 200,
                message: 'Torrent uploaded successfully',
                data: {
                    infoHash,
                    name: torrent.name,
                    files: taskInfo.files.map((file) => ({
                        name: file.name,
                        size: formatBytes(file.length),
                        mime: file.mime,
                    })),
                },
            });
        });
    } catch (error) {
        console.error('Error in handleTorrentUpload:', error);
        return apiResponse(res, {
            success: false,
            statusCode: 500,
            message: 'Streaming error',
            error: error instanceof Error ? error.message : 'Unknown streaming error',
        });
    }
};