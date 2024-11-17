// pages/api/torrent/handlers/info.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { TaskInfo } from '@/types';
import { cache } from '@/pages/config/torrent.config';

export const getFileInfo = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { infoHash, fileIndex } = req.query;

    if (!infoHash || typeof infoHash !== 'string') {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }

    const task = cache.get(infoHash) as TaskInfo;
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    if (fileIndex && typeof fileIndex === 'string') {
        const file = task.files[parseInt(fileIndex, 10)];
        if (!file) {
            res.status(404).json({ error: 'File not found' });
            return;
        }
        res.status(200).json({ file });
    } else {
        res.status(200).json({ task });
    }
};

export const handleProgressCheck = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { infoHash } = req.query;

    if (!infoHash || typeof infoHash !== 'string') {
        res.status(400).json({ error: 'Invalid request' });
        return;
    }

    const task = cache.get(infoHash) as TaskInfo;
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    res.status(200).json({
        status: 'success',
        progress: task.progress,
        files: task.files
    });
};