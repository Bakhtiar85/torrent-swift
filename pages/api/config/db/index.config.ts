// pages\api\config\db\index.config.ts
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Ensure the database directory exists
const DB_PATH = path.join(process.cwd(), 'data');

export async function getDb() {
    return open({
        filename: path.join(DB_PATH, 'torrent_vault.db'),
        driver: sqlite3.Database
    });
}
export async function initDb() {
    const db = await getDb();

    await db.exec(`
        CREATE TABLE IF NOT EXISTS torrent_vault (
            info_hash TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            size BIGINT NOT NULL,
            file_count INTEGER NOT NULL,
            category TEXT,
            upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            zip_path TEXT,
            zip_size BIGINT,
            metadata TEXT,
            poster_file TEXT,
            status TEXT DEFAULT 'downloading'
        )
    `);

    return db;
}