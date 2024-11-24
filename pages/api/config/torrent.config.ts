// config/torrent.config.ts
import NodeCache from 'node-cache';
import * as WebTorrent from 'webtorrent';

// Cache configuration
export const cache = new NodeCache({ stdTTL: 86400, checkperiod: 600 });

// WebTorrent client configuration
export const client = new (WebTorrent as any).default();

// MIME type mappings
export const mimeTypes: { [key: string]: string } = {
    'mp4': 'video/mp4',
    'mkv': 'video/x-matroska',
    'avi': 'video/x-msvideo',
    'mp3': 'audio/mpeg',
    'pdf': 'application/pdf',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'default': 'application/octet-stream'
};

// Store torrent buffers for potential reuse
export const torrentBuffers = new Map<string, Buffer>();