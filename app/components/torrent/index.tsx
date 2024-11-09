// app/components/torrent/index.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { TorrentFile } from '@/types';

const TorrentDownloader = () => {
    const [file, setFile] = useState<File | null>(null);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [files, setFiles] = useState<TorrentFile[]>([]);
    const [showProgress, setShowProgress] = useState<boolean>(false);
    const [isProgressButtonDisabled, setIsProgressButtonDisabled] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    useEffect(() => {
        const savedTaskId = localStorage.getItem('torrentTaskId');
        const savedFileName = localStorage.getItem('torrentFileName');
        if (savedTaskId) {
            setTaskId(savedTaskId);
        }
        if (savedFileName) {
            setFile(new File([], savedFileName));
        }
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            localStorage.setItem('torrentFileName', selectedFile.name);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);

        const formData = new FormData();
        formData.append('torrentFile', file);

        try {
            const response = await fetch('/api/torrent/stream', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setTaskId(data.taskId);
                localStorage.setItem('torrentTaskId', data.taskId);
                setFiles([]); // Reset the files list before the upload
            } else {
                console.error('Upload failed:', await response.text());
            }
        } catch (error) {
            console.error('Error during upload:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleProgressCheck = async () => {
        if (!taskId) return;

        setShowProgress(true);
        setIsProgressButtonDisabled(0);

        let randomTimeout = Math.floor(Math.random() * (15 - 5 + 1)) + 5;

        try {
            const response = await fetch(`/api/torrent/stream?taskId=${taskId}`);
            const data = await response.json();

            if (!isNaN(data.progress)) {
                setProgress(data.progress);
            }

            // If download is complete, initiate file download
            if (data.progress === 100) {
                // Fetch the files available for download
                setFiles(data.files || []); // Update files available for download
                console.log("DATA: ", data.files);
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
            // First check if the file is still available
            const checkResponse = await fetch(`/api/torrent/stream?taskId=${taskId}&info=true`);
            if (!checkResponse.ok) {
                throw new Error('File not available');
            }

            // Proceed with download
            window.location.href = `/api/torrent/stream?taskId=${taskId}&fileIndex=${fileIndex}`;
        } catch (error) {
            console.error('Download error:', error);
            // Show error to user (you can use your preferred notification system)
            alert('Download failed. Please try uploading the torrent file again.');

            // Clear the stored taskId since it's no longer valid
            localStorage.removeItem('torrentTaskId');
            localStorage.removeItem('torrentFileName');

            // Reset the component state
            setTaskId(null);
            setFile(null);
            setFiles([]);
            setProgress(0);
            setShowProgress(false);
        }
    };

    const progressResetCancel = async () => {
        if (!taskId) return;

        try {
            // Make the DELETE request to cancel the task
            const response = await fetch(`/api/torrent/stream?taskId=${taskId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                // Handle error if cancellation was unsuccessful
                console.error('Failed to cancel task. Try in new tab or browser.');
                // return;
            }

            const data = await response.json();
            console.log('Cancellation response:', data);

            // Clear the stored taskId since it's no longer valid
            localStorage.removeItem('torrentTaskId');
            localStorage.removeItem('torrentFileName');
            setTaskId(null);
            setFiles([]);
            setShowProgress(false);
            setProgress(0);
            setIsProgressButtonDisabled(null);

            // Optionally, show a confirmation message to the user
            alert('Torrent task has been successfully cancelled.');
        } catch (error) {
            console.error('Error cancelling task:', error);
            alert('An error occurred while trying to cancel the task.');
        }
    };

    return (
        <div className="w-11/12 md:w-4/5 max-w-lg mx-auto -mt-2 md:-mt-16 sm:-mt-28 p-4 sm:p-6 bg-gray-800 rounded-lg shadow-xl text-white transition-all duration-300 ease-in-out hover:shadow-2xl">
            {!taskId && !isUploading && (
                <>
                    <div className="mb-3 sm:mb-4">
                        <label htmlFor="torrent-file" className="block text-sm lg:text-base font-semibold text-gray-300 mb-2 tracking-wider shadow-md">
                            Select Torrent File
                        </label>
                        <input
                            id="torrent-file"
                            type="file"
                            className="w-full text-xs lg:text-sm text-gray-300 file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-200"
                            onChange={handleFileChange}
                            accept=".torrent"
                            required={true}
                        />
                    </div>

                    {file && (
                        <p className="text-xs lg:text-sm text-gray-400 mb-3 sm:mb-4 shadow-sm">Selected file: {file.name}</p>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={!file}
                        className={`w-full py-2 sm:py-3 px-3 sm:px-4 border border-transparent rounded-lg shadow-lg text-xs lg:text-sm font-medium text-white tracking-wider ${file ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 cursor-not-allowed'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200`}
                    >
                        Upload Torrent
                    </button>
                </>
            )}

            {taskId && (
                <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <p className="text-sm sm:text-base text-gray-400 mb-2 sm:mb-4 italic">Torrent is processing...</p>
                        <span className="text-xs text-red-600 mb-4 italic font-semibold underline hover:scale-110 sm:hover:scale-150 hover:text-white hidden sm:block">Kindly wait, you will be notify when done!</span>
                    </div>
                    <button
                        onClick={handleProgressCheck}
                        disabled={isProgressButtonDisabled !== null}
                        className={`relative w-full h-8 sm:h-10 py-1.5 sm:py-2 px-3 sm:px-4 border border-transparent rounded-lg shadow-lg text-xs sm:text-sm font-medium text-white ${isProgressButtonDisabled !== null ? 'bg-green-400/75 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all duration-200`}
                    >
                        {isProgressButtonDisabled !== null ? (
                            <span className="absolute left-0 right-0 top-2 sm:top-3 text-xs text-black">
                                wait {isProgressButtonDisabled}s please!
                            </span>
                        ) : (
                            'Show Progress'
                        )}
                    </button>

                    <p className='w-full text-center mt-4 sm:mt-5 text-red-600 mb-3 sm:mb-4 text-xs md:text-sm md:font-semibold underline hover:scale-110 sm:hover:scale-150 hover:text-white'>
                        <strong>Warning!</strong>
                        <br />
                        <span>Frequently Clicking *Show Progress* Button can cause trouble. kindly wait...</span>
                    </p>

                    <button
                        onClick={progressResetCancel}
                        disabled={isProgressButtonDisabled !== null}
                        className={`relative w-full h-8 sm:h-10 py-1.5 sm:py-2 px-3 sm:px-4 border border-transparent rounded-lg shadow-lg text-[10px] md:text-sm font-medium text-white ${isProgressButtonDisabled !== null ? 'bg-blue-400/75 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200`}
                    >
                        Re-Upload files/Terminate Download in Progress.
                    </button>
                </div>
            )}

            {progress > 0 && (
                <div className="mt-4 sm:mt-6">
                    <h3 className="text-base lg:text-lg font-medium text-gray-300 mb-2 tracking-widest shadow-md">Download Progress</h3>
                    <div className="w-full bg-gray-700 rounded-full h-2 sm:h-2.5">
                        <div
                            className="bg-blue-600 h-2 sm:h-2.5 rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <p className="text-xs lg:text-sm font-medium text-gray-400 mt-2 shadow-sm">{progress.toFixed(2)}% Complete</p>
                </div>
            )}

            {files.length > 0 && (
                <div className="mt-4 sm:mt-6">
                    <h3 className="text-base lg:text-lg font-medium text-gray-300 mb-3 sm:mb-4 tracking-wide shadow-md">Files Available for Download</h3>
                    <div className="max-h-48 md:max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                        <ul className="space-y-2 sm:space-y-3">
                            {files?.map(({ name, length, downloaded, progress, path, mime, streamReady }, index) => (
                                <li key={index} className="flex items-center justify-between py-1.5 sm:py-3 px-1 sm:px-4 bg-gray-700 rounded-lg shadow-sm">
                                    <span className="text-[10px] lg:text-sm italic font-medium text-gray-300">{index++}: &nbsp;</span>
                                    <span className="text-[10px] lg:text-sm font-medium text-gray-300 shadow-sm truncate max-w-[30%]">{name}</span>

                                    {progress > 0 && (
                                        <div className="flex-1 w-3/5 mx-2">
                                            <div className="w-full bg-gray-700 rounded-full h-2 sm:h-2.5 relative">
                                                <div
                                                    className="bg-blue-600 h-2 sm:h-2.5 rounded-full"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                                <p className="text-[8px] lg:text-sm font-medium text-gray-400 mt-0 shadow-sm absolute left-0 right-0 text-center">{progress.toFixed(2)}%</p>
                                            </div>
                                        </div>
                                    )}

                                    {progress && <button
                                        disabled={progress !== 100}
                                        onClick={() => handleFileDownload(index)}
                                        className={`ml-2 sm:ml-4 inline-flex items-center px-2 sm:px-3 py-1 border border-transparent text-[10px] md:text-xs font-medium rounded-md shadow-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 disabled:opacity-0`}
                                    >
                                        Download
                                    </button>}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TorrentDownloader;