// app\components\hooks\useZipDownload.ts
import { useState, useEffect } from 'react';
import { ZipInfo, UseZipDownloadReturn } from '@/types';

export const useZipDownload = (): UseZipDownloadReturn => {
    const [availableZips, setAvailableZips] = useState<ZipInfo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const refreshZipList = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/torrent/list');
            const data = await response.json();

            if (response.ok && data.success) {
                setAvailableZips(data.data.filter((zip: ZipInfo) => zip.status === 'zipped'));
            } else {
                setError(data.message || 'Failed to fetch ZIP list');
            }
        } catch (err) {
            setError('Failed to fetch ZIP list');
            console.error('Error fetching ZIP list:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadZip = async (infoHash: string="c9e15763f722f23e98a29decdfae341b98d53056") => {
        try {
            const response = await fetch(`/api/torrent/stream?infoHash=${infoHash}&download=true`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Download failed');
            }

            // Get filename from content-disposition header
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `download-${infoHash}.zip`;
            if (contentDisposition) {
                const matches = /filename="([^"]*)"/.exec(contentDisposition);
                if (matches && matches[1]) {
                    filename = decodeURIComponent(matches[1]);
                }
            }

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed');
            console.error('Error downloading ZIP:', err);
        }
    };

    // Initial fetch of ZIP list
    useEffect(() => {
        refreshZipList();
    }, []);

    return {
        availableZips,
        isLoading,
        error,
        downloadZip,
        refreshZipList,
    };
};