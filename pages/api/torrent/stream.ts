// pages/api/torrent/stream.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { handleTorrentUpload } from './handlers/upload';
import { streamFile } from './handlers/stream';
import { getFileInfo, handleProgressCheck } from './handlers/info';
import { cancelTask } from './handlers/cancel';
import { apiResponse } from '../utils/response.utils';
import { downloadZip } from './handlers/download';

export const config = {
    api: {
        bodyParser: false,
        responseLimit: false,
    },
};

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
                    if (req.query.download) {
                        return await downloadZip(req, res);
                    } else {
                        return await handleProgressCheck(req, res);
                    }
                }
            case 'DELETE':
                console.log('cancelTask::> Req:', req.query);
                return await cancelTask(req, res);
            default:
                return apiResponse(res, {
                    success: false,
                    statusCode: 405,
                    message: 'Method not allowed',
                    error: 'Method not allowed',
                });;
        }
    } catch (error) {
        console.error('stream.ts::43 error:', error);
        return apiResponse(res, {
            success: false,
            statusCode: 500,
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};

export default handler;