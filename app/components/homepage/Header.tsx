// app/components/homepage/Header.tsx
import { siteLogo } from '@/public/assets/svgIcons'
import Link from 'next/link'

const Header: React.FC = () => {
    return (
        <header className="z-10 border-b border-gray-700/70 w-full text-center font-serif p-3 sm:pb-3.5 tracking-wider shadow-md flex flex-col lg:flex-row justify-evenly items-center">
            <div className="flex justify-center items-center gap-2.5">
                <Link href={"/"} className='cursor-pointer'>
                    <span className='block w-8 md:w-12 h-auto rotate-12 pb-2.5'>
                        {siteLogo}
                    </span>
                </Link>
                <Link href={"/"} className='cursor-pointer'>
                    <h1 className="font-extrabold text-2xl 2xl:text-4xl text-transparent bg-gradient-to-r from-blue-500/75 from-5% to-white/75 bg-clip-text drop-shadow-lg sm:mb-0">
                        Torrent Swift
                    </h1>
                </Link>
            </div>

            <p className="text-sm sm:text-lg lg:text-xl text-transparent bg-gradient-to-r from-white from-10% to-blue-800 bg-clip-text xl:-mt-1.5 italic">
                Secure & Anonymous Downloads
            </p>
        </header>
    );
};

export default Header;
