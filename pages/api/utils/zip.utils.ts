// pages\api\utils\zip.utils.ts
import archiver from 'archiver';
import fs from 'fs'; // Use the standard `fs` module here
import fsPromises from 'fs/promises'; // Use `fs/promises` for promise-based methods
import path from 'path';
import { getDb } from '../config/db/index.config';
import { TorrentFile } from '@/types';

const ZIP_DIR = path.join(process.cwd(), 'data', 'zips');

export async function ensureZipDir() {
    try {
        await fsPromises.access(ZIP_DIR);
    } catch {
        await fsPromises.mkdir(ZIP_DIR, { recursive: true });
    }
}

export async function createTorrentZip(infoHash: string, webTorrentFiles: TorrentFile[]): Promise<string> {
    await ensureZipDir();
    const zipPath = path.join(ZIP_DIR, `${infoHash}.zip`);
    
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });
        
        output.on('close', () => resolve(zipPath));
        archive.on('error', reject);
        
        archive.pipe(output);
        
        // Add each file to the archive
        webTorrentFiles.forEach(file => {
            const filePath = path.join(process.cwd(), file.path);
            archive.file(filePath, { name: file.name });
        });
        
        archive.finalize();
    });
}