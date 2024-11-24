"use client";
import { useEffect, useState } from 'react';
import HomePage from './components/torrent'
import TourGuide from './components/modals/TourGuide';
import { siteLogo } from '@/public/assets/svgIcons';

export default function Home() {
  const [startTour, setStartTour] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  const handleTourStart = () => {
    setStartTour(true);
  };

  const handleTourEnd = () => {
    setStartTour(false);
  };

  if (!loaded) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-1 sm:p-4 md:p-10 md:pt-3 bg-gray-900 text-white">
      <div className="z-10 w-full text-center font-serif p-3 sm:pb-3.5 tracking-wider shadow-md flex flex-col lg:flex-row justify-evenly items-center">
        <div className="flex justify-center items-center gap-2.5">
          <span className='rotate-12 pb-2.5'>
            {siteLogo}
          </span>
          <h1 className="font-extrabold text-2xl 2xl:text-4xl text-transparent bg-gradient-to-r from-blue-500/75 from-5% to-white/75 bg-clip-text drop-shadow-lg sm:mb-0">
            Torrent Swift
          </h1>
        </div>

        <div id="tour-start-btn" className="relative">
          <div>
            <button onClick={handleTourStart} className="px-2.5 py-1.5 text-sm text-white bg-blue-400 rounded-md">
              Start Tour
            </button>
          </div>

          {startTour && (
            <TourGuide start={startTour} setStartTour={setStartTour} onTourEnd={handleTourEnd} />
          )}

        </div>

        <p className="text-sm sm:text-lg lg:text-xl text-transparent bg-gradient-to-r from-white from-10% to-blue-800 bg-clip-text xl:-mt-1.5 italic">
          Secure & Anonymous Downloads
        </p>
      </div>

      <div className="flex-grow w-full flex flex-col justify-center items-center my-4 sm:my-6">
        <HomePage />
      </div>

      <footer className="w-full text-sm xl:text-lg text-center p-6 text-gray-400 shadow-lg bg-gray-900">
        <div className="mb-4">
          <p className="font-semibold text-gray-200">
            &copy; {new Date().getFullYear()} <b>Torrent Swift</b> - Fast, Secure <b>&</b> Anonymous Downloads
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
          <div>
            <p className="italic font-mono">
              <i>Explore my</i>&nbsp;
              <a
                className="underline underline-offset-2 hover:text-gray-300 transition"
                target="_blank"
                rel="noopener noreferrer"
                href="http://makhdoom-abubakar.vercel.app/projects"
              >
                <b>Projects</b>
              </a>
            </p>
          </div>
          <div>
            <p className="italic font-mono">
              <i>Hire me on</i>&nbsp;
              <a
                className="underline underline-offset-2 hover:text-gray-300 transition"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.upwork.com/freelancers/~017304c8ed7eb17c49"
              >
                <b>Upwork</b>
              </a>
              &nbsp;or&nbsp;
              <a
                className="underline underline-offset-2 hover:text-gray-300 transition"
                target="_blank"
                rel="noopener noreferrer"
                href="https://www.fiverr.com/ma_bakhtiar"
              >
                <b>Fiverr</b>
              </a>
            </p>
          </div>
          <div className="flex items-center gap-1">
            👩‍💻
            <p className="italic font-mono">
              <i>Ping Me @</i>&nbsp;
              <a
                className="underline underline-offset-2 hover:text-gray-300 transition"
                target="_blank"
                rel="noopener noreferrer"
                href="mailto:makhdoomabubar85@gmail.com"
              >
                <b>Gmail</b>
              </a>
            </p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-xs text-gray-500">
            Powered by <b>🥈 Webtorrent</b>
          </p>
        </div>
      </footer>
    </main>
  );
}
