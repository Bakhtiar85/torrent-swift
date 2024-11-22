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
            const response = await fetch(`/api/torrent/stream?infoHash=${taskId}`);
            const data = await response.json();

            if (!isNaN(data.progress)) {
                setProgress(data.progress);
            }

            setFiles(data.files || []);

            if (data.progress === 100) {
                randomTimeout = 2;
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
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
            const checkResponse = await fetch(`/api/torrent/stream?infoHash=${taskId}&info=true`);
            if (!checkResponse.ok) {
                throw new Error('File not available');
            }

            window.location.href = `/api/torrent/stream?infoHash=${taskId}&fileIndex=${fileIndex}`;
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