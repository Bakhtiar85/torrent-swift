"use client";
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useZipDownload } from '../components/hooks/useZipDownload';

const ZipList = lazy(() => import('../components/torrent/modules/ZipList'));

export default function listing() {
    const {
        availableZips,
        isLoading: isLoadingZips,
        error: zipError,
        downloadZip,
        refreshZipList,
    } = useZipDownload();
    return (
        <Suspense fallback={<p>Loading downloads...</p>}>
            <ZipList
                zips={availableZips}
                onDownload={downloadZip}
                isLoading={isLoadingZips}
            />
        </Suspense>

    )
}