import WebTorrent from "webtorrent";
import { TorrentAnalysis } from "@/types";

function analyzeTorrentContent(torrent: WebTorrent.Torrent): TorrentAnalysis {
    // Get the largest file as main content
    const mainFile = torrent.files
        .sort((a: any, b: any) => b.length - a.length)[0];

    if (!mainFile) {
        return { category: 'unknown' };
    }

    const fileName = mainFile.name.toLowerCase();
    const extension = fileName.split('.').pop();

    if (!extension) {
        return {
            category: "unknown",
            resolution: "example",
            quality: "example",
            isHDR: false,
            codec: "example"
        };
    }

    // Detect content type based on file extensions and patterns
    const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'm4v'];
    const gameExts = ['iso', 'pkg', 'xci', 'nsp', 'rom', 'exe', 'zip'];
    const appExts = ['exe', 'dmg', 'app', 'apk', 'deb', 'rpm'];
    const musicExts = ['mp3', 'flac', 'wav', 'm4a', 'aac'];

    // Resolution patterns
    const resolutionPatterns = {
        '4k': /4k|2160p|uhd/i,
        '1080p': /1080p|1920x1080|full.?hd|fhd/i,
        '720p': /720p|1280x720|hd/i,
        '480p': /480p|854x480|sd/i
    };

    // Quality and codec patterns
    const quality = fileName.match(/(?:web-?dl|blu-?ray|brrip|dvdrip|hdr|dv|dolby)/i)?.[0] || undefined;
    const codec = fileName.match(/(?:x264|x265|hevc|xvid|h264|h265)/i)?.[0] || undefined;
    const isHDR = /hdr|dolby.?vision|dv/i.test(fileName);

    // Detect resolution
    let resolution: string | undefined;
    for (const [res, pattern] of Object.entries(resolutionPatterns)) {
        if (pattern.test(fileName)) {
            resolution = res;
            break;
        }
    }

    // Determine content type
    let category: TorrentAnalysis['category'] = 'unknown';

    if (videoExts.includes(extension)) {
        // Check if it's a TV show or movie
        category = /s\d{1,2}e\d{1,2}|season.\d+|episode.\d+/i.test(fileName) ? 'tv' : 'movie';
    } else if (gameExts.includes(extension)) {
        category = 'game';
    } else if (appExts.includes(extension)) {
        category = 'app';
    } else if (musicExts.includes(extension)) {
        category = 'music';
    }

    return {
        category,
        resolution,
        quality,
        isHDR,
        codec
    };
}

// Function to get a human-readable description
function getContentDescription(torrent: any): string {
    const analysis = analyzeTorrentContent(torrent);
    const mainFile = torrent.files.sort((a: any, b: any) => b.length - a.length)[0];

    let description = `Type: ${analysis.category.toUpperCase()}`;

    if (analysis.category === 'movie' || analysis.category === 'tv') {
        description += analysis.resolution ? ` | Resolution: ${analysis.resolution}` : '';
        description += analysis.quality ? ` | Quality: ${analysis.quality}` : '';
        description += analysis.codec ? ` | Codec: ${analysis.codec}` : '';
        description += analysis.isHDR ? ' | HDR' : '';
    }

    return description;
}

export { analyzeTorrentContent, getContentDescription, type TorrentAnalysis };