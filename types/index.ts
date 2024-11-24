// types/index.ts
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

export interface State {
    run: boolean;
    stepIndex: number;
}

export interface TourGuideProps {
    start: boolean;
    setStartTour: (value: boolean) => void;
    onTourEnd: () => void;
}

/************************************************ FILES INTERFACES *********************************************/

export interface UseTorrentProgressReturn {
    progress: number | null;
    files: TorrentFile[];
    showProgress: boolean;
    isProgressButtonDisabled: number | null;
    handleProgressCheck: () => Promise<void>;
    handleFileDownload: (fileIndex: number) => Promise<void>;
    progressResetCancel: () => Promise<void>;
}

export interface UseTorrentUploadReturn {
    file: File | null;
    magnetLink: string | null;
    taskId: string | null;
    isUploading: boolean;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleMagnetLinkChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleUpload: () => Promise<void>;
}

export interface UploadFormProps {
    file: File | null;
    magnetLink: string | null;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleMagnetLinkChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleUpload: () => Promise<void>;
}

export interface ProgressControlsProps {
    isProgressButtonDisabled: number | null;
    handleProgressCheck: () => Promise<void>;
    progressResetCancel: () => Promise<void>;
}

export interface FileListTableProps {
    files: TorrentFile[];
    handleFileDownload: (fileIndex: number) => Promise<void>;
}

export interface ApiResponse<T = null> {
    success: boolean; // Indicates if the request succeeded
    message: string;  // Human-readable message
    error?: string;   // Error details (optional, only for failed responses)
    data?: T;         // Data payload (optional, only for successful responses)
}