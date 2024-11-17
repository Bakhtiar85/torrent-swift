// pages/api/torrent/stream.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { apiConfig } from '@/pages/config/torrent.config';
import { handleTorrentUpload } from './handlers/upload';
import { streamFile } from './handlers/stream';
import { getFileInfo, handleProgressCheck } from './handlers/info';
import { cancelTask } from './handlers/cancel';

export const config = apiConfig;

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    try {
        console.log(`Received ${req.method} request to /api/torrent/stream`);

        switch (req.method) {
            case 'POST':
                console.log('handleTorrentUpload::>');
                return await handleTorrentUpload(req, res);
            case 'GET':
                if (req.query.fileIndex !== undefined) {
                    console.log('streamFile::> Req:', req.query);
                    return await streamFile(req, res);
                } else if (req.query.info !== undefined) {
                    console.log('getFileInfo::> Req:', req.query);
                    return await getFileInfo(req, res);
                } else {
                    console.log('handleProgressCheck::> Req:', req.query);
                    return await handleProgressCheck(req, res);
                }
            case 'DELETE':
                console.log('cancelTask::> Req:', req.query);
                return await cancelTask(req, res);
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

export default handler;