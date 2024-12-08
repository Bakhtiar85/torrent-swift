// app/components/torrent/ProgressControls.tsx
import { ProgressControlsProps } from '@/types';

const ProgressControls: React.FC<ProgressControlsProps> = ({
    isProgressButtonDisabled,
    handleProgressCheck,
    progressResetCancel,
    isZipReadyForDownload,
}) => (
    <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <p className="text-sm sm:text-base text-gray-400 mb-2 sm:mb-4 italic">Torrent is processing...</p>
            <span className="text-xs text-red-600 mb-4 italic font-semibold underline hover:scale-105 sm:hover:scale-110 hover:text-white hidden sm:block">
                Kindly wait, you will be notify when done!
            </span>
        </div>

        <button
            id="step-5"
            onClick={handleProgressCheck}
            disabled={isProgressButtonDisabled !== null || isZipReadyForDownload}
            className={`relative w-full h-8 sm:h-10 py-1.5 sm:py-2 px-3 sm:px-4 border border-transparent rounded-lg shadow-lg text-xs sm:text-sm font-medium text-white ${(isProgressButtonDisabled !== null || isZipReadyForDownload) ? 'bg-green-400/75 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all duration-200`}
        >
            {isProgressButtonDisabled !== null ? (
                <span className="absolute left-0 right-0 top-2 sm:top-3 text-xs text-black">
                    wait {isProgressButtonDisabled}s please!
                </span>
            ) : (
                'Show Progress'
            )}
        </button>

        <p id="warning-message" className="w-full text-center mt-4 sm:mt-5 text-red-600 mb-3 sm:mb-4 text-xs md:text-sm md:font-semibold underline hover:scale-105 sm:hover:scale-110 hover:text-white">
            <strong>Warning!</strong>
            <br />
            <span>Frequently Clicking *Show Progress* Button can cause trouble. kindly wait...</span>
        </p>

        <button
            id="re-upload-btn"
            onClick={progressResetCancel}
            disabled={isProgressButtonDisabled !== null}
            className={`relative w-full h-8 sm:h-10 py-1.5 sm:py-2 px-3 sm:px-4 border border-transparent rounded-lg shadow-lg text-[10px] md:text-sm font-medium text-white ${isProgressButtonDisabled !== null ? 'bg-blue-400/75 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200`}
        >
            Re-Upload files/Clear Cache
        </button>
    </div>
);

export default ProgressControls;