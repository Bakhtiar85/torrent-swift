// pages/api/config/torrent.config.ts
import NodeCache from 'node-cache';
import * as WebTorrent from 'webtorrent';

// Tracker Peer Servers
export const trackerPeerServers: string[] = [
    'udp://tracker.opentrackr.org:1337',
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://p4p.arenabg.com:1337/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://tracker.dler.org:6969/announce',
    'udp://open.stealth.si:80/announce',
    'udp://ipv4.tracker.harry.lu:80/announce',
    'https://opentracker.i2p.rocks:443/announce',
    'udp://explodie.org:6969',
    'udp://tracker.coppersurfer.tk:6969',
    'udp://tracker.empire-js.us:1337',
    'udp://tracker.leechers-paradise.org:6969',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.fastcast.nz',
    'wss://tracker.openwebtorrent.com'
]

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