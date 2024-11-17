// pages/api/torrent/handlers/cancel.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { TaskInfo } from '@/types';
import { cache, client } from '@/pages/config/torrent.config';

export const cancelTask = async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    const { infoHash } = req.query;

    if (!infoHash || typeof infoHash !== 'string') {
        res.status(400).json({ error: 'Invalid infoHash' });
        return;
    }

    console.log(`Cancelling torrent download for task ${infoHash}`);

    const task = cache.get(infoHash) as TaskInfo;
    if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
    }

    const torrent = await client.get(task.infoHash);
    if (!torrent) {
        res.status(404).json({ error: 'Torrent not found in client' });
        return;
    }

    try {
        torrent.destroy({ destroyStore: true }, (err: any) => {
            if (err) {
                console.error('Error destroying torrent:', err);
                res.status(500).json({ error: 'Failed to cancel torrent download' });
                return;
            }

            cache.del(infoHash);
            console.log(`Torrent for task ${infoHash} successfully cancelled and cleaned up.`);
            res.status(200).json({ status: 'success', message: 'Torrent download cancelled' });
        });
    } catch (error) {
        console.error('Cancellation error:', error);
        res.status(500).json({
            error: 'Failed to cancel torrent download',
            details: error instanceof Error ? error.message : 'Unknown error',
        });
    }
};