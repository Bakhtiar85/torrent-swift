// app/components/homepage/Disclaimer.tsx
import React from "react";
import NavButtons from "./NavButtons";

const Disclaimer: React.FC = () => {
    return (
        <section className="disclaimer my-2 py-2.5 flex flex-col justify-center items-center bg-gray-900">
            <div className="flex flex-col items-center justify-center gap-2 text-white px-6 text-center">
                <h1 className="text-4xl font-bold mb-4 text-blue-500 underline underline-offset-8">Welcome To The Site</h1>
                <p className="font-semibold max-w-3xl mb-3.5">
                    TorSwift is designed to provide a secure and anonymous platform for downloading and managing files via torrent technology. <br />
                    The main goal is to simplify the downloading process while ensuring privacy and safety.
                </p>
                <p className="text-md max-w-3xl shadow-sm shadow-blue-400/40 py-1.5 px-6">
                    <span className="font-semibold text-yellow-400 text-lg underline underline-offset-4 decoration-dotted">
                        Disclaimer:
                    </span>{" "}
                    <span className="text-xs text-gray-300 leading-relaxed">
                        This service is intended solely for legal use. The downloading or distribution of copyrighted material without authorization is prohibited. TorSwift does not host any files on its servers nor does it condone piracy in any form. Users are responsible for ensuring their activities comply with local laws and regulations.
                    </span>
                </p>
                <p className="text-sm italic my-3.5 text-red-400 animate-glow hover:scale-105 transition-transform duration-500 ease-in-out">
                    By using this platform, you agree to adhere to all applicable laws and take full responsibility for your downloads.
                </p>
                <p className="text-lg font-medium mb-1 py-1 w-full text-blue-300">Navigate below to explore TorSwift</p>
            </div>
            <NavButtons />
        </section>
    );
};

export default Disclaimer;
