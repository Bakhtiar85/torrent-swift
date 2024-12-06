// pages/api/services/torrent.service.ts
import { TaskInfo } from '@/types';
import { cache, client, torrentBuffers } from '../config/torrent.config';
import { getMimeType } from '../../utils/torrent.utils';
import * as WebTorrent from 'webtorrent';

export const updateProgress = (torrent: WebTorrent.Torrent, infoHash: string): void => {
    const taskInfo = cache.get(infoHash) as TaskInfo;
    if (taskInfo) {
        taskInfo.downloadedBytes = torrent.downloaded;
        taskInfo.progress = torrent.progress * 100;
        taskInfo.downloadSpeed = torrent.downloadSpeed;
        taskInfo.timeRemaining = torrent.timeRemaining;
        taskInfo.status = torrent.progress === 1 ? 'completed' : 'downloading';

        taskInfo.files = torrent.files.map(file => ({
            name: file.name,
            length: file.length,
            downloaded: file.downloaded,
            progress: file.progress * 100,
            path: file.path,
            mime: getMimeType(file.name),
            streamReady: file.progress > 0.1
        }));

        cache.set(infoHash, taskInfo);
    }
};

export const setupTorrentHandlers = (torrent: WebTorrent.Torrent, infoHash: string): void => {
    const progressInterval = setInterval(() => {
        if (!cache.get(infoHash)) {
            clearInterval(progressInterval);
            return;
        }
        updateProgress(torrent, infoHash);
    }, 1000);

    torrent.on('done', () => {
        console.log(`Torrent download completed for task ${infoHash}`);
        clearInterval(progressInterval);
        updateProgress(torrent, infoHash);
    });

    torrent.on('error', (err) => {
        console.error(`Torrent error for task ${infoHash}:`, err);
        const taskInfo = cache.get(infoHash) as TaskInfo;
        if (taskInfo) {
            taskInfo.status = 'error';
            cache.set(infoHash, taskInfo);
        }
        cleanupTorrent(torrent.infoHash);
    });
};

export const cleanupTorrent = async (infoHash: string) => {
    try {
        const torrent = await client.get(infoHash);
        if (torrent) {
            console.log(`Cleaning up torrent: ${infoHash}`);
            torrent.destroy({ removeTorrent: true });
            torrentBuffers.forEach((_, bufferInfoHash) => {
                const task = cache.get(bufferInfoHash) as TaskInfo;
                if (task && task.infoHash === infoHash) {
                    torrentBuffers.delete(bufferInfoHash);
                    return;
                }
            });
        }
    } catch (error) {
        console.error('Cleanup error:', error);
    }
};

export const recoverTorrent = async (infoHash: string, buffer: Buffer): Promise<void> => {
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

                cache.set(infoHash, taskInfo);
                setupTorrentHandlers(torrent, infoHash);
                resolve();
            });
        } catch (error) {
            console.error('Recovery failed:', error);
            reject(error);
        }
    });
};