// app/components/torrent/index.tsx
'use client';
import React, { lazy, Suspense } from 'react';
import { useTorrentProgress } from '../hooks/useTorrentProgress';
import { useTorrentUpload } from '../hooks/useTorrentUpload';
import UploadForm from './modules/UploadForm';

const FileListTable = lazy(() => import('./modules/FileListTable'));
const ProgressControls = lazy(() => import('./modules/ProgressControls'));

const TorrentDownloader: React.FC = () => {
    const {
        file,
        magnetLink,
        taskId,
        isUploading,
        downloadUrl,
        isZipReadyForDownload,
        handleFileChange,
        handleMagnetLinkChange,
        handleUpload,
    } = useTorrentUpload();

    const {
        progress,
        files,
        showProgress,
        progress_downloadUrl,
        progress_isZipReadyForDownload,
        isProgressButtonDisabled,
        handleProgressCheck,
        handleFileDownload,
        progressResetCancel,
    } = useTorrentProgress(taskId);

    const handleZipDownload = () => {
        if (downloadUrl) {
            window.location.href = downloadUrl;
        } else if (progress_downloadUrl) {
            window.location.href = progress_downloadUrl;
        }
    };

    return (
        <div id="step-1" className="w-11/12 md:w-4/5 max-w-2xl mx-auto -mt-2 lg:-mt-0 p-4 sm:p-6 bg-gray-800 rounded-lg shadow-xl text-white transition-all duration-300 ease-in-out hover:shadow-2xl">
            {!taskId && !isUploading && (
                <UploadForm
                    file={file}
                    magnetLink={magnetLink}
                    handleFileChange={handleFileChange}
                    handleMagnetLinkChange={handleMagnetLinkChange}
                    handleUpload={handleUpload}
                />
            )}

            {isUploading && !taskId &&
                (
                    <p className="text-sm sm:text-lg lg:text-xl text-transparent bg-gradient-to-r from-white from-10% to-blue-800 bg-clip-text xl:-mt-1.5 italic">
                        Kindly Wait, Working On Your Request!
                    </p>
                )
            }

            {taskId && (
                <Suspense fallback={<p>Loading progress controls...</p>}>
                    <ProgressControls
                        isProgressButtonDisabled={isProgressButtonDisabled}
                        handleProgressCheck={handleProgressCheck}
                        progressResetCancel={progressResetCancel}
                        isZipReadyForDownload={isZipReadyForDownload || progress_isZipReadyForDownload}
                    />
                </Suspense>
            )}

            {showProgress && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-300 mb-2 tracking-widest shadow-md">Download Progress</h3>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {(isZipReadyForDownload || progress_isZipReadyForDownload) && (
                <div className="flex justify-between items-center mt-2">
                    <p className="text-sm font-medium text-gray-400 shadow-sm">{progress}% Complete</p>
                    {(progress === 100 || isZipReadyForDownload || progress_isZipReadyForDownload) && (downloadUrl||progress_downloadUrl) && (
                        <button
                            onClick={handleZipDownload}
                            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download ZIP
                        </button>
                    )}
                </div>
            )}

            {files.length > 0 && (
                <div className="mt-4 sm:mt-6">
                    <h3 className="text-base lg:text-lg font-medium text-gray-300 mb-3 sm:mb-4 tracking-wide shadow-md">
                        Setting up your files!
                    </h3>
                    <Suspense fallback={<p>Loading file list...</p>}>
                        <FileListTable
                            files={files}
                            handleFileDownload={handleFileDownload}
                        />
                    </Suspense>
                </div>
            )}
        </div>
    );
};

export default TorrentDownloader;