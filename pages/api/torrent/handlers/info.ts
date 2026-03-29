// pages/api/torrent/handlers/info.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import { TaskInfo } from '@/types';
import { cache } from '@/pages/api/config/torrent.config';
import { apiResponse } from '../../utils/response.utils';
import { initDb, getDb } from '../../config/db/index.config';

export const getFileInfo = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { infoHash, fileIndex } = req.query;

    if (!infoHash || typeof infoHash !== 'string') {
        return apiResponse(res, {
            success: false,
            statusCode: 400,
            message: 'Invalid request',
            error: 'Invalid request',
        });
    }

    const task = cache.get(infoHash) as TaskInfo;
    if (!task) {
        return apiResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Task not found',
            error: 'Task not found',
        });
    }

    if (fileIndex && typeof fileIndex === 'string') {
        const file = task.files[parseInt(fileIndex, 10)];
        if (!file) {
            return apiResponse(res, {
                success: false,
                statusCode: 404,
                message: 'File not found',
                error: 'File not found',
            });
        }
        return apiResponse(res, {
            success: true,
            statusCode: 200,
            message: 'File info retrieved successfully',
            data: { file },
        });
    } else {
        return apiResponse(res, {
            success: true,
            statusCode: 200,
            message: 'Task info retrieved successfully',
            data: { task },
        });
    }
};

export const handleProgressCheck = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { infoHash } = req.query;

    if (!infoHash || typeof infoHash !== 'string') {
        return apiResponse(res, {
            success: false,
            statusCode: 400,
            message: 'Invalid request',
            error: 'Invalid request',
        });
    }

    await initDb();

    const db = await getDb();
    const existingTorrent = await db.get(
        'SELECT * FROM torrent_vault WHERE info_hash = ?',
        [infoHash]
    );

    // Completed jobs: ZIP + DB row must work even if in-memory cache expired (restart, TTL, etc.)
    if (existingTorrent?.zip_path) {
        try {
            await fs.access(existingTorrent.zip_path);
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
                    downloadUrl: `/api/torrent/stream?infoHash=${infoHash}&download=true`,
                    progress: 100,
                    files: [],
                },
            });
        } catch {
            await db.run('DELETE FROM torrent_vault WHERE info_hash = ?', [infoHash]);
            console.log(`Removed invalid database entry for ${infoHash}`);
        }
    }

    const task = cache.get(infoHash) as TaskInfo;
    if (!task) {
        return apiResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Task not found',
            error: 'Task not found',
        });
    }

    return apiResponse(res, {
        success: true,
        statusCode: 200,
        message: 'Task info retrieved successfully',
        data: {
            progress: task.progress,
            files: task.files,
        },
    });
};