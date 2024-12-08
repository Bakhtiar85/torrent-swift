// hooks/useTorrentProgress.ts
import { useState } from 'react';
import { UseTorrentProgressReturn, TorrentFile } from '@/types';

export const useTorrentProgress = (taskId: string | null): UseTorrentProgressReturn => {
    const [progress, setProgress] = useState<number | null>(null);
    const [files, setFiles] = useState<TorrentFile[]>([]);
    const [showProgress, setShowProgress] = useState<boolean>(false);
    const [isProgressButtonDisabled, setIsProgressButtonDisabled] = useState<number | null>(null);

    const handleProgressCheck = async () => {
        if (!taskId) return;

        setShowProgress(true);
        setIsProgressButtonDisabled(0);

        let randomTimeout = Math.floor(Math.random() * (15 - 5 + 1)) + 5;

        try {
            const response = await fetch(`/api/torrent/stream?infoHash=${taskId}`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const APIResponse = await response.json();
            console.log(APIResponse)
            if (response.ok && APIResponse.success) {
                let { progress, files } = APIResponse.data;
                if (!isNaN(progress)) {
                    setProgress(progress);
                }

                setFiles(files || []);

                if (progress === 100) {
                    randomTimeout = 2;
                }
            } else {
                randomTimeout = 4;
                console.error('Progress check failed:', APIResponse.error || APIResponse.message);
                alert(`Error: ${APIResponse.message || 'Progress check failed'}`);
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
            alert('An error occurred while fetching progress');
        } finally {
            setIsProgressButtonDisabled(randomTimeout);

            const countdownInterval = setInterval(() => {
                setIsProgressButtonDisabled((prev) => {
                    if (prev !== null && prev > 1) {
                        return prev - 1;
                    } else {
                        clearInterval(countdownInterval);
                        return null;
                    }
                });
            }, 1000);
        }
    };

    const handleFileDownload = async (fileIndex: number) => {
        if (!taskId) return;

        try {
            const checkResponse = await fetch(`/api/torrent/stream?infoHash=${taskId}&info=true`, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const APIResponse = await checkResponse.json();
            console.log(APIResponse)
            if (checkResponse.ok && APIResponse.success) {
                window.location.href = `/api/torrent/stream?infoHash=${taskId}&fileIndex=${fileIndex}`;
            } else {
                throw new Error(APIResponse.error || APIResponse.message || 'File not available');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Download failed. Please try uploading the torrent file again.');
            resetState();
        }
    };

    const progressResetCancel = async () => {
        if (!taskId) return;

        try {
            resetState();
            alert('Re-Upload files.');
            if (typeof window !== 'undefined') {
                window.location.reload(); // Reloads the page
            }
        } catch (error) {
            console.error('Error cancelling task:', error);
            alert('An error occurred while clearing.');
        }
    };

    const resetState = () => {
        localStorage.removeItem('torrentInfoHash');
        localStorage.removeItem('torrentFileName');
        localStorage.removeItem('torrentDownloadUrl');
        setProgress(0);
        setFiles([]);
        setShowProgress(false);
        setIsProgressButtonDisabled(null);
    };

    return {
        progress,
        files,
        showProgress,
        isProgressButtonDisabled,
        handleProgressCheck,
        handleFileDownload,
        progressResetCancel,
    };
};