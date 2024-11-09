import HomePage from './components/torrent'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-3 sm:p-4 md:p-10 bg-gray-900 text-white">
      <div className="z-10 w-full text-center font-serif p-3 sm:p-5 tracking-wider">
        <h1 className="font-extrabold text-3xl sm:text-4xl xl:text-6xl text-blue-500 drop-shadow-lg shadow-blue-500 sm:mb-0">
          DarkTorrent Hub
        </h1>
        <p className="text-lg sm:text-xl xl:text-3xl text-gray-300 mt-0.5 xl:mt-3 italic shadow-md">
          Secure & Anonymous Downloads
        </p>
      </div>

      <div className="flex-grow w-full flex flex-col justify-center items-center my-4 sm:my-6">
        <HomePage />
      </div>

      <footer className="w-full text-sm xl:text-lg text-center p-4 sm:p-6 text-gray-400 shadow-md">
        &copy; {new Date().getFullYear()} DarkTorrent Hub - Fast, Secure, Anonymous Downloads
      </footer>
    </main>
  );
}
