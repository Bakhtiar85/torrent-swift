import React from "react";
import Link from "next/link";

const navLinks = [
    { href: "/client", label: "Downloader", title: "Download files from .torrent or magnet link", isDisabled: false },
    { href: "/listings", label: "Listings", title: "Items ready for download", isDisabled: false },
    { href: "/about", label: "About Us", title: "Little about us", isDisabled: true },
    { href: "/contact", label: "Contact Us", title: "Report any issue", isDisabled: true }
];

const NavLinks: React.FC = () => {
    return (
        <div className="flex flex-wrap justify-center space-x-6 space-y-2 md:space-y-0 md:flex-row mt-1">
            {navLinks.map((link) => (
                <Link
                    key={link.href}
                    href={!link.isDisabled ? link.href : "/"}
                    className={`
                        shadow-sm shadow-blue-800 px-2.5 py-0.5 rounded-md
                        text-blue-400
                        hover:text-blue-500
                        font-medium
                        relative
                        ${link.isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <span
                        className={`
                            font-medium
                            relative
                            pb-1
                            after:content-['']
                            ${link.isDisabled ? '' : 'after:absolute after:w-full after:h-[1px] after:bg-blue-400 after:bottom-0 after:left-0 after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100'}
                        `}
                        title={link.isDisabled ? '!...!' : link.title}>
                        {link.label}
                    </span>
                </Link>
            ))}
        </div>
    );
};

export default NavLinks;