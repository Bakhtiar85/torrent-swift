import HomePage from './components/torrent'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-10 bg-gray-900 text-white">
      <div className="z-10 w-full items-center justify-center text-center font-serif text-3xl p-5 tracking-wider">
        <h1 className="font-extrabold text-4xl md:text-6xl text-blue-500 drop-shadow-lg shadow-blue-500">
          DarkTorrent Hub
        </h1>
        <p className="text-xl md:text-3xl text-gray-300 mt-4 italic shadow-md">
          Secure & Anonymous Downloads
        </p>
      </div>

      <div className="flex-grow w-full flex flex-col justify-center items-center">
        <HomePage />
      </div>

      <footer className="w-full text-lg md:text-xl text-center p-6 text-gray-400 shadow-md">
        &copy; {new Date().getFullYear()} DarkTorrent Hub - Fast, Secure, Anonymous Downloads
      </footer>
    </main>
  );
}
