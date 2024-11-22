// app/components/torrent/modules/FileListTable.tsx
import React, { useState, useRef, useEffect } from 'react';
import { FileListTableProps, TorrentFile } from '@/types';

const FileListTable: React.FC<FileListTableProps> = ({ files, handleFileDownload }) => {
    const [activeDetailIndex, setActiveDetailIndex] = useState<number | null>(null);
    const detailsRef = useRef<(HTMLDivElement | null)[]>([]);
    const [downloadingStates, setDownloadingStates] = useState<{ [key: number]: boolean }>({});

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
    };

    // Handle click outside to close details
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeDetailIndex !== null) {
                const activeDetails = detailsRef.current[activeDetailIndex];
                const clickedElement = event.target as Node;

                if (activeDetails && !activeDetails.contains(clickedElement)) {
                    // Check if the click was on the info button
                    const isInfoButton = (clickedElement as HTMLElement).closest('[data-info-button]');
                    if (!isInfoButton) {
                        setActiveDetailIndex(null);
                    }
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeDetailIndex]);

    const toggleDetails = (index: number) => {
        setActiveDetailIndex(activeDetailIndex === index ? null : index);
    };

    return (
        <div className="w-full bg-gray-900 rounded-xl shadow-xl overflow-hidden">
            <div className="relative">
                {/* Fixed header */}
                <div className="sticky top-0 z-10 bg-gray-800/50">
                    <table id="file-list-table" className="w-full table-fixed">
                        <thead>
                            <tr>
                                <th className="w-4 md:w-8 px-4 py-4 text-left text-[10px] md:text-xs font-semibold text-gray-300 uppercase tracking-wider">#</th>
                                <th className="w-[50%] md:w-[45%] px-4 py-4 text-left text-[10px] md:text-xs font-semibold text-gray-300 uppercase tracking-wider">File</th>
                                <th className="w-[50%] md:w-[30%] px-4 py-4 text-left text-[10px] md:text-xs font-semibold text-gray-300 uppercase tracking-wider truncate">Progress</th>
                                <th className="w-20 md:w-[120px] px-4 py-4 text-left text-[10px] md:text-xs font-semibold text-gray-300 uppercase tracking-wider truncate">Actions</th>
                            </tr>
                        </thead>
                    </table>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto max-h-44 lg:max-h-96">
                    <table className="w-full table-fixed">
                        <tbody className="divide-y divide-gray-800">
                            {files?.map((file, index) => (
                                <tr
                                    key={index}
                                    className="group hover:bg-gray-800/50 transition-colors duration-200"
                                >
                                    <td className="w-4 md:w-8 px-4 py-4 whitespace-nowrap">
                                        <span className="text-sm font-medium text-gray-400">
                                            {index + 1}
                                        </span>
                                    </td>
                                    <td className="w-[50%] md:w-[45%] px-2.5 md:px-4 py-2.5 md:py-4">
                                        <div className="relative flex items-center">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <span aria-label="file-name" className="block text-xs md:text-sm font-medium text-gray-200 truncate max-w-full">
                                                        {file.name}
                                                    </span>
                                                </div>
                                                <div className="flex justify-start items-baseline gap-2 m-0.5 lg:gap-4">
                                                    <span className="block text-[8px] md:text-xs text-gray-500 truncate">
                                                        {formatBytes(file.length)}
                                                    </span>

                                                    <button
                                                        data-info-button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleDetails(index);
                                                        }}
                                                        className={`flex-shrink-0 transition-opacity duration-200 ${activeDetailIndex === index ? 'opacity-100' : 'opacity-10 group-hover:opacity-100'}`}
                                                        title={`${activeDetailIndex === index ? 'Hide Details' : 'Show Details'}`}
                                                    >
                                                        <span className="text-gray-400 hover:text-gray-200">ℹ️</span>
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Click-to-show details */}
                                            {activeDetailIndex === index && (
                                                <div className="absolute hidden group-hover:block z-20 bg-gray-800 p-2.5 md:p-4 rounded-xl shadow-2xl -top-2 left-1/2 ml-4 w-36 md:w-72 border border-gray-700">
                                                    <div className="space-y-1 lg:space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] md:text-xs font-medium text-gray-400">Type</span>
                                                            <span className="text-[8px] md:text-xs text-gray-300">{file.mime || 'Unknown'}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] md:text-xs font-medium text-gray-400">Downloaded</span>
                                                            <span className="text-[8px] md:text-xs text-gray-300">{formatBytes(file.downloaded)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[8px] md:text-xs font-medium text-gray-400">Stream Ready</span>
                                                            <span className={`text-[8px] md:text-xs ${file.streamReady ? 'text-green-400' : 'text-red-400'}`}>
                                                                {file.streamReady ? 'Yes' : 'No'}
                                                            </span>
                                                        </div>
                                                        <div className="pt-2 border-t border-gray-700 hidden">
                                                            <span className="text-[8px] md:text-xs font-medium text-gray-400">Path</span>
                                                            <p className="text-[8px] md:text-xs text-gray-300 break-all mt-1">{file.path}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="w-[50%] md:w-[30%] px-4 py-4">
                                        {file.progress > 0 && (
                                            <div className="w-full">
                                                <div className="relative w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                                    <div
                                                        className="absolute top-0 left-0 h-full bg-blue-600 transition-all duration-300"
                                                        style={{ width: `${file.progress}%` }}
                                                    />
                                                    <span className="absolute inset-0 text-[10px] text-center text-gray-300 leading-none font-medium flex items-center justify-center">
                                                        {file.progress.toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="w-20 md:w-[120px] px-4 py-4">
                                        {file.progress > 0 && (
                                            <button
                                                onClick={() => handleFileDownload(index)}
                                                disabled={file.progress !== 100 || downloadingStates[index]}
                                                className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md 
                                               text-white bg-blue-600 hover:bg-blue-700 
                                               disabled:bg-gray-500 disabled:cursor-not-allowed
                                               transition-colors duration-200 w-full"
                                            >
                                                {downloadingStates[index] ? (
                                                    <span className="flex items-center">
                                                        <svg
                                                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                        </svg>
                                                        Processing
                                                    </span>
                                                ) : (
                                                    'Download'
                                                )}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FileListTable;