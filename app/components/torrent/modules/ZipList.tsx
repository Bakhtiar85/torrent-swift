// app\components\torrent\modules\ZipList.tsx
import React from 'react';
import { ZipInfo } from '@/types';

interface ZipListProps {
    zips: ZipInfo[];
    onDownload: (infoHash: string) => Promise<void>;
    isLoading: boolean;
}

const ZipList: React.FC<ZipListProps> = ({ zips, onDownload, isLoading }) => {
    return (
        <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-300 mb-4 tracking-widest shadow-md">
                Available Downloads
            </h3>
            {isLoading ? (
                <p className="text-gray-400">Loading available downloads...</p>
            ) : zips.length === 0 ? (
                <p className="text-gray-400">No downloads available yet</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead>
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Name</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Size</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Upload Date</th>
                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-300">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {zips.map((zip) => (
                                <tr key={zip.infoHash}>
                                    <td className="px-4 py-3 text-sm text-gray-300">{zip.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-300">
                                        {(zip.size / (1024 * 1024)).toFixed(2)} MB
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-300">
                                        {new Date(zip.uploadDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => onDownload(zip.infoHash)}
                                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ZipList;