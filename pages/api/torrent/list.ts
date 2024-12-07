// pages/api/torrent/list.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getDb } from '../config/db/index.config';
import { apiResponse } from '../utils/response.utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return apiResponse(res, {
            success: false,
            statusCode: 405,
            message: 'Method not allowed'
        });
    }

    try {
        const db = await getDb();
        const torrents = await db.all(`
            SELECT info_hash, name, size, file_count, category, 
                   upload_date, status, zip_size 
            FROM torrents 
            ORDER BY upload_date DESC
        `);

        return apiResponse(res, {
            success: true,
            statusCode: 200,
            message: 'Torrents retrieved successfully',
            data: torrents
        });
    } catch (error) {
        console.error('Error listing torrents:', error);
        return apiResponse(res, {
            success: false,
            statusCode: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}