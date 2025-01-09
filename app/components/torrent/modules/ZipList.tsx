// app\components\torrent\modules\ZipList.tsx
import React from 'react';
import { ZipInfo } from '@/types';
import Image from 'next/image';

interface ZipListProps {
    zips: ZipInfo[];
    onDownload: (infoHash: string) => Promise<void>;
    isLoading: boolean;
}

const ZipList: React.FC<ZipListProps> = ({ zips, onDownload, isLoading }) => {
    function getResolution(size: number) {
        const sizeInMB = size / (1024 * 1024);
        if (sizeInMB > 4000) return "2160p"; // Example threshold
        if (sizeInMB > 2000) return "1080p";
        if (sizeInMB > 1000) return "720p";
        return "480p";
    }

    function getMovieCoverImage(movieName: string) {
        const baseImageUrl = "https://img.yts.mx/assets/images/movies/";

        // Extract meaningful name (remove tags like [1080p], [WEBRip], etc.)
        const meaningfulName = movieName.replace(/\[.*?\]/g, "").trim();

        // Replace spaces with underscores for the image URL
        const formattedName = meaningfulName.toLowerCase().replace(/ /g, "_").replace(/\(|\)/g, "");

        // Return the full image URL
        return `${baseImageUrl}${formattedName}/medium-cover.jpg`;
    }

    function getShortenedMovieName(movieName: string): string {
        // Remove any content in square brackets (e.g., [1080p], [BluRay])
        const cleanedName = movieName.replace(/\[.*?\]/g, "").trim();

        // Try to capture the movie title and year by matching a pattern like "Mufasa The Lion King 2024"
        const regex = /^(.*?)(\d{4})$/; // Match the title and year pattern at the end
        const match = cleanedName.match(regex);

        if (match) {
            return `${match[1].trim()} ${match[2]}`; // Return the movie title with the year
        }

        // Fallback: if no year is found, just return the cleaned name
        return cleanedName;
    }


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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-6">
                    {zips.map((zip) => (
                        <div
                            key={zip.info_hash}
                            className="relative bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition duration-300"
                        >
                            {/* Resolution Badge */}
                            <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded">
                                {getResolution(zip.size)} {/* Helper to determine resolution */}
                            </span>

                            {/* Poster Image */}
                            <div className="h-48 bg-gray-700 flex items-center justify-center relative">
                                <Image
                                    src={zip.poster_file || getMovieCoverImage(getShortenedMovieName(zip.name))}
                                    alt="Movie Cover"
                                    fill
                                    className="object-contain"
                                    // Add error handling
                                    onError={(e) => {
                                        // Fallback to default image if loading fails
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/fallback-image.jpg'; // Your fallback image
                                    }}
                                />
                            </div>
                            {/* Movie Info */}
                            <div className="p-4">
                                <h4 className="text-white font-bold truncate">{getShortenedMovieName(zip.name)}</h4>
                                <p className="text-gray-400 text-sm">{new Date(zip.uploadDate).getFullYear()}</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {(zip.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                <button
                                    onClick={() => onDownload(zip.info_hash)}
                                    className="mt-4 w-full px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 transition"
                                >
                                    Download
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ZipList;