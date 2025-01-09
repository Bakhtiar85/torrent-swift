// pages/api/torrent/handlers/upload.ts
import { NextApiResponse } from 'next';
import * as WebTorrent from 'webtorrent';
import { promises as fs } from 'fs';
import { TaskInfo, TorrentAnalysis } from '@/types';
import { cache, client, trackerPeerServers } from '@/pages/api/config/torrent.config';
import { setupTorrentHandlers } from '@/pages/api/services/torrent.service';
import { formatBytes, getMimeType, runMiddleware, upload } from '../../utils/torrent.utils';
import { apiResponse } from '../../utils/response.utils';
import { initDb, getDb } from '../../config/db/index.config';
import { analyzeTorrentContent, getContentDescription } from './analyzer';

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
            temp.add(torrentSource, { announce: trackerPeerServers }, (torrent: WebTorrent.Torrent) => {
                resolve(torrent);
                setTimeout(() => {
                    torrent.destroy();
                    temp.destroy();
                }, 1000);
            });
        });

        const infoHash = tempTorrent.infoHash;

        await initDb(); // Ensure the database and table are initialized before querying

        // Check database for existing torrent
        const db = await getDb();
        const existingTorrent = await db.get(
            'SELECT * FROM torrent_vault WHERE info_hash = ?',
            [infoHash]
        );

        if (existingTorrent) {
            // Verify if ZIP file exists
            try {
                if (existingTorrent.zip_path) {
                    await fs.access(existingTorrent.zip_path);
                    // ZIP file exists, return download info
                    return apiResponse(res, {
                        success: true,
                        statusCode: 200,
                        message: 'Torrent already exists with ZIP file',
                        data: {
                            infoHash,
                            name: existingTorrent.name,
                            size: existingTorrent.size,
                            zipSize: existingTorrent.zip_size,
                            status: 'ready_for_download',
                            downloadUrl: `/api/torrent/stream?infoHash=${infoHash}&download=true`
                        },
                    });
                }
            } catch (error) {
                // ZIP file doesn't exist or is inaccessible, delete database entry
                await db.run(
                    'DELETE FROM torrent_vault WHERE info_hash = ?',
                    [infoHash]
                );
                console.log(`Removed invalid database entry for ${infoHash}`);
            }
        }

        // Check for existing task in cache
        const existingTask = Array.from(cache.keys()).find(key => {
            const task = cache.get(key) as TaskInfo;
            return task && task.infoHash === infoHash;
        });

        if (existingTask) {
            const existingTaskInfo = cache.get(existingTask) as TaskInfo;
            return apiResponse(res, {
                success: true,
                statusCode: 200,
                message: 'Torrent already in progress',
                data: {
                    infoHash,
                    name: existingTaskInfo.name,
                    files: existingTaskInfo.files,
                    status: 'already_exists',
                },
            });
        }

        // Add torrent to client for new download
        client.add(torrentSource, { announce: trackerPeerServers }, (torrent: WebTorrent.Torrent) => {
            // console.log("TORRENT INFO::", torrent);

            const contentAnalysis: TorrentAnalysis = analyzeTorrentContent(torrent);
            const { category, resolution, quality } = contentAnalysis;
            console.log("Content Analysis:", contentAnalysis);
            console.log("Content Description:", getContentDescription(torrent));

            let posterURL = null;
            if (Array.isArray(torrent.urlList) && torrent.urlList[0]) {
                // Get the base URL from the torrent's web seed with fallback handling
                const baseUrl = torrent.urlList[0] || torrent.ws || '';
                // Find the poster file and construct its URL
                const posterFile = torrent.files.find(file =>
                    file.name.toLowerCase().includes('poster')
                );

                // Construct the poster URL if poster file exists and we have a base URL
                posterURL = (posterFile && baseUrl) ?
                    `${baseUrl}${encodeURIComponent(torrent.name)}/${encodeURIComponent(posterFile.name)}` :
                    undefined;

                console.log("posterURL::::", posterURL)
            }

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
            setupTorrentHandlers(torrent, infoHash, { posterURL, category, resolution, quality });

            return apiResponse(res, {
                success: true,
                statusCode: 200,
                message: 'Torrent download started',
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
            message: 'Upload error',
            error: error instanceof Error ? error.message : 'Unknown upload error',
        });
    }
};