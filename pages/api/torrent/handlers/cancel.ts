// pages/api/torrent/handlers/cancel.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { TaskInfo } from '@/types';
import { cache, client } from '@/pages/api/config/torrent.config';
import { apiResponse } from '@/pages/utils/response.utils';

export const cancelTask = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { infoHash } = req.query;

    if (!infoHash || typeof infoHash !== 'string') {
        return apiResponse(res, {
            success: false,
            statusCode: 400,
            message: 'Invalid infoHash',
            error: 'Invalid infoHash',
        });
    }

    console.log(`Cancelling torrent download for task ${infoHash}`);

    const task = cache.get(infoHash) as TaskInfo;
    if (!task) {
        return apiResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Task not found',
            error: 'Task not found',
        });;
    }

    const torrent = await client.get(task.infoHash);
    if (!torrent) {
        return apiResponse(res, {
            success: false,
            statusCode: 404,
            message: 'Torrent Info not found in client',
            error: 'Torrent Info not found in client',
        });
    }

    try {
        torrent.destroy({ destroyStore: true }, (err: any) => {
            if (err) {
                console.error('Error destroying torrent:', err);
                return apiResponse(res, {
                    success: false,
                    statusCode: 404,
                    message: 'Failed to cancel the process',
                    error: 'Failed to cancel the process',
                });
            }

            cache.del(infoHash);
            console.log(`Torrent for task ${infoHash} successfully cancelled and cleaned up.`);
            return apiResponse(res, {
                success: true,
                statusCode: 200,
                message: 'Torrent download cancelled',
            });
        });
    } catch (error) {
        console.error('cancel.ts::62 error:', error);
        return apiResponse(res, {
            success: false,
            statusCode: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};