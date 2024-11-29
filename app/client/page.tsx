"use client";
import React, { lazy, Suspense, useEffect, useState } from 'react';
const TorrentDownloader = lazy(() => import('../components/torrent'));
// const TourGuide = lazy(() => import('../components/modals/TourGuide'));


export default function client() {
    // const [startTour, setStartTour] = useState(true);
    // const [loaded, setLoaded] = useState(false);

    // useEffect(() => {
    //     setLoaded(true);
    // }, []);

    // const handleTourStart = () => {
    //     setStartTour(true);
    // };

    // const handleTourEnd = () => {
    //     setStartTour(false);
    // };

    // if (!loaded) {
    //     return null;
    // }
    return (
        <>
            {/* <div id="tour-start-btn" className="relative">
                <div>
                    <button onClick={handleTourStart} className="px-2.5 py-1.5 text-sm text-white bg-blue-400 rounded-md">
                        Start Tour
                    </button>
                </div>

                <Suspense fallback={<p>Loading Site...</p>}>
                    {startTour && (
                        <TourGuide start={startTour} setStartTour={setStartTour} onTourEnd={handleTourEnd} />
                    )}
                </Suspense>

            </div> */}

            <Suspense fallback={<p>Loading Downloader...</p>}>
                <TorrentDownloader />
            </Suspense>
        </>
    );
}