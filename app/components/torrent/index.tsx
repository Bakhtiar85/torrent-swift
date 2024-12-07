// app/components/torrent/index.tsx
'use client';
import React, { lazy, Suspense } from 'react';
import { useTorrentProgress } from '../hooks/useTorrentProgress';
import { useTorrentUpload } from '../hooks/useTorrentUpload';
import { useZipDownload } from '../hooks/useZipDownload';
import UploadForm from './modules/UploadForm';

const FileListTable = lazy(() => import('./modules/FileListTable'));
const ProgressControls = lazy(() => import('./modules/ProgressControls'));
const ZipList = lazy(() => import('./modules/ZipList'));

const TorrentDownloader: React.FC = () => {
    const {
        file,
        magnetLink,
        taskId,
        isUploading,
        handleFileChange,
        handleMagnetLinkChange,
        handleUpload,
    } = useTorrentUpload();

    const {
        progress,
        files,
        showProgress,
        isProgressButtonDisabled,
        handleProgressCheck,
        handleFileDownload,
        progressResetCancel,
    } = useTorrentProgress(taskId);

    const {
        availableZips,
        isLoading: isLoadingZips,
        error: zipError,
        downloadZip,
        refreshZipList,
    } = useZipDownload();

    React.useEffect(() => {
        if (progress === 100) {
            refreshZipList();
        }
    }, [progress, refreshZipList]);

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
                    <p className="text-sm font-medium text-gray-400 mt-2 shadow-sm">{progress}% Complete</p>
                </div>
            )}

            <Suspense fallback={<p>Loading downloads...</p>}>
                <ZipList
                    zips={availableZips}
                    onDownload={downloadZip}
                    isLoading={isLoadingZips}
                />
            </Suspense>

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