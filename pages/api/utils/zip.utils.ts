// pages\api\utils\zip.utils.ts
import * as yazl from 'yazl';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
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
        const zipfile = new yazl.ZipFile();
        const output = fs.createWriteStream(zipPath);

        zipfile.outputStream.pipe(output);

        // Track files added and errors
        let filesAdded = 0;
        const filesToAdd = webTorrentFiles.length;

        output.on('close', () => {
            console.log(`Zip file created: ${zipPath}`);
            console.log(`Total files added: ${filesAdded} of ${filesToAdd}`);
            resolve(zipPath);
        });

        output.on('error', (err) => {
            console.error('Output stream error:', err);
            reject(err);
        });

        // Add each file to the zip
        webTorrentFiles.forEach(file => {
            const fullPath = path.join(process.cwd(), file.path);

            // Verbose logging
            console.log('Attempting to add file:', {
                originalPath: file.path,
                fullPath,
                fileName: file.name,
                fileExists: fs.existsSync(fullPath)
            });

            // Check if file exists before adding
            if (!fs.existsSync(fullPath)) {
                console.warn(`File not found: ${fullPath}`);
                return;
            }

            try {
                zipfile.addFile(fullPath, file.name);
                filesAdded++;
            } catch (err) {
                console.error(`Error adding file ${file.name}:`, err);
            }
        });

        // Finalize the zip file
        zipfile.end(); // Corrected here
    });
}
