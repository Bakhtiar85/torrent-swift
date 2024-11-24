// hooks/useTorrentUpload.ts
import { useState, useEffect } from 'react';
import { UseTorrentUploadReturn } from '@/types';

export const useTorrentUpload = (): UseTorrentUploadReturn => {
    const [file, setFile] = useState<File | null>(null);
    const [magnetLink, setMagnetLink] = useState<string | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    useEffect(() => {
        const savedTaskId = localStorage.getItem('torrentInfoHash');
        const savedFileName = localStorage.getItem('torrentFileName');
        if (savedTaskId) setTaskId(savedTaskId);
        if (savedFileName) setFile(new File([], savedFileName));
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setMagnetLink(null);
            localStorage.setItem('torrentFileName', selectedFile.name);
        }
    };

    const handleMagnetLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const link = event.target.value;
        setMagnetLink(link);
        localStorage.setItem('torrentFileName', `magnet: ${link}`);
        setFile(null);
    };

    const handleUpload = async () => {
        if (!file && !magnetLink) return;
        setIsUploading(true);

        try {
            const response = await fetch('/api/torrent/stream', {
                method: 'POST',
                ...(magnetLink
                    ? {
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'magnet', magnetLink }),
                    }
                    : {
                        body: (() => {
                            const formData = new FormData();
                            if (file) formData.append('torrentFile', file);
                            formData.append('type', 'file');
                            return formData;
                        })(),
                    }),
            });

            const APIResponse = await response.json();
            console.log(APIResponse)
            if (response.ok && APIResponse.success) {
                let { infoHash } = APIResponse.data;
                setTaskId(infoHash);
                localStorage.setItem('torrentInfoHash', infoHash);
            } else {
                console.error('Upload failed:', APIResponse.error || APIResponse.message);
                alert(`Error: ${APIResponse.message || 'Upload failed'}`);
            }
        } catch (error) {
            console.error('Error during upload:', error);
            alert('An error occurred during the upload');
        } finally {
            setIsUploading(false);
        }
    };

    return {
        file,
        magnetLink,
        taskId,
        isUploading,
        handleFileChange,
        handleMagnetLinkChange,
        handleUpload,
    };
};
