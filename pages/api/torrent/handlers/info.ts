// pages/api/torrent/handlers/info.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { TaskInfo } from '@/types';
import { cache } from '@/pages/config/torrent.config';
import { apiResponse } from '@/pages/utils/response.utils';

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