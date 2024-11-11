import HomePage from './components/torrent'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-3 sm:p-4 md:p-10 bg-gray-900 text-white">
      <div className="z-10 w-full text-center font-serif p-3 sm:pb-5 tracking-wider shadow-md">
        <h1 className="font-extrabold text-2xl sm:text-3xl 2xl:text-5xl text-blue-500 drop-shadow-lg shadow-blue-500 sm:mb-0">
          Torrent Swift
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mt-0.5 xl:mt-1.5 italic">
          Secure & Anonymous Downloads
        </p>
      </div>

      <div className="flex-grow w-full flex flex-col justify-center items-center my-4 sm:my-6">
        <HomePage />
      </div>

      <footer className="w-full text-sm xl:text-lg text-center p-4 sm:p-6 text-gray-400 shadow-md">
        &copy; {new Date().getFullYear()} Torrent Swift - Fast, Secure, Anonymous Downloads
      </footer>
    </main>
  );
}
