// app/components/homepage/Footer.tsx
const Footer: React.FC = () => {
    return (
        <footer className="w-full border-t border-gray-700/70 text-sm xl:text-lg text-center p-3 sm:pt-3.5 text-gray-400 bg-gray-900">
            <div className="mb-0.5">
                <p className="font-semibold text-gray-200">
                    &copy; {new Date().getFullYear()} <b>Torrent Swift</b> - Fast, Secure <b>&</b> Anonymous Downloads
                </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 opacity-25">
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
            <div className="mt-4">
                <p className="text-xs text-gray-500">
                    Powered by <b>🥈 Webtorrent</b>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
