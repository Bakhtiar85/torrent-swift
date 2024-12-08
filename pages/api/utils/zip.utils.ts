// pages\api\utils\zip.utils.ts
import * as yazl from 'yazl';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import * as WebTorrent from 'webtorrent';
import { cache, client } from '../config/torrent.config';
import { TaskInfo } from '@/types';

const ZIP_DIR = path.join(process.cwd(), 'data', 'zips');

export async function ensureZipDir() {
    try {
        await fsPromises.access(ZIP_DIR);
    } catch {
        await fsPromises.mkdir(ZIP_DIR, { recursive: true });
    }
}

export async function createTorrentZip(infoHash: string, files: WebTorrent.TorrentFile[]): Promise<string> {
    await ensureZipDir();
    const zipPath = path.join(ZIP_DIR, `${infoHash}.zip`);
    
    return new Promise((resolve, reject) => {
        const zipFile = new yazl.ZipFile();
        const writeStream = fs.createWriteStream(zipPath);
        
        // Set up completion handler
        writeStream.on('close', () => resolve(zipPath));
        writeStream.on('error', reject);
        
        // Pipe zip file to write stream
        zipFile.outputStream.pipe(writeStream);

        // Counter to track processed files
        let processedFiles = 0;

        // Process each file
        files.forEach((file) => {
            const stream = file.createReadStream();
            
            // Add the stream to the zip with the file's name
            zipFile.addReadStream(stream, file.name, {
                compress: true,
                mtime: new Date(),
                mode: 0o644 // Standard file permissions
            });

            stream.on('end', () => {
                processedFiles++;
                if (processedFiles === files.length) {
                    // All files processed, end the zip
                    zipFile.end();
                }
            });

            stream.on('error', (err) => {
                console.error(`Error processing file ${file.name}:`, err);
                reject(err);
            });
        });
    });
}

// Helper function to verify torrent and get its files
export async function getTorrentFiles(infoHash: string): Promise<WebTorrent.TorrentFile[]> {
    const taskInfo = cache.get(infoHash) as TaskInfo;
    if (!taskInfo) {
        throw new Error('Task not found in cache');
    }

    const torrent = client.get(taskInfo.infoHash);
    if (!torrent) {
        throw new Error('Torrent not found in client');
    }

    return torrent.files;
}