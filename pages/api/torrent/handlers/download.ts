// pages\api\torrent\handlers\download.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';  // Use regular fs for streams
import { promises as fsPromises } from 'fs';  // Use this for async operations
import { initDb, getDb } from '../../config/db/index.config';
import { apiResponse } from '../../utils/response.utils';

export const downloadZip = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { infoHash } = req.query;

    if (!infoHash || typeof infoHash !== 'string') {
        return apiResponse(res, {
            success: false,
            statusCode: 400,
            message: 'Invalid infoHash',
            error: 'Invalid infoHash'
        });
    }

    try {
        await initDb(); // Ensure the database and table are initialized before querying

        const db = await getDb();
        const torrent = await db.get(
            'SELECT zip_path, name FROM torrent_vault WHERE info_hash = ? AND status = ?',
            [infoHash, 'zipped']
        );

        if (!torrent || !torrent.zip_path) {
            return apiResponse(res, {
                success: false,
                statusCode: 404,
                message: 'ZIP file not found',
                error: 'ZIP file not found'
            });
        }

        const stats = await fsPromises.stat(torrent.zip_path);
        
        res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Length': stats.size,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(torrent.name)}.zip"`
        });

        const fileStream = fs.createReadStream(torrent.zip_path);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error in downloadZip:', error);
        return apiResponse(res, {
            success: false,
            statusCode: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};