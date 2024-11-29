"use client";
import React, { lazy } from 'react';

const Disclaimer = lazy(() => import('./components/homepage/Disclaimer'));

export default function Home() {
  return (
    <section className='homepage'>

      <div className="flex-grow w-full flex flex-col justify-center items-center my-4 sm:my-6">
        <Disclaimer />
      </div>

    </section>
  );
}
