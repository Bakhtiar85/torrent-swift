export interface TorrentFile {
    name: string;
    length: number;
    downloaded: number;
    progress: number;
    path: string;
    mime?: string;
    streamReady: boolean;
}

export interface TaskInfo {
    infoHash: string;
    name: string;
    files: TorrentFile[];
    progress: number;
    downloadedBytes: number;
    size: number;
    timeRemaining: number;
    downloadSpeed: number;
    status: 'queued' | 'downloading' | 'completed' | 'error';
}

export interface FileResponse {
    name: string;
    size: string;
    mime: string | undefined;
}