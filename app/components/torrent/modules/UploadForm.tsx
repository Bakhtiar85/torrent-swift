// app/components/torrent/UploadForm.tsx
interface UploadFormProps {
    file: File | null;
    magnetLink: string | null;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleMagnetLinkChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    handleUpload: () => Promise<void>;
}

const UploadForm: React.FC<UploadFormProps> = ({
    file,
    magnetLink,
    handleFileChange,
    handleMagnetLinkChange,
    handleUpload,
}) => (
    <>
        <div className="mb-3 sm:mb-4">
            <label htmlFor="torrent-file" className="block text-sm lg:text-base font-semibold text-gray-300 mb-3.5 tracking-wider">
                Select Torrent File
            </label>
            <input
                id="torrent-file"
                type="file"
                className="w-full text-xs lg:text-sm text-gray-300 file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-md file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-200"
                onChange={handleFileChange}
                accept=".torrent"
                required={true}
            />
        </div>

        <div className="mb-3 sm:mb-4">
            <label htmlFor="magnet-link" className="block text-sm lg:text-base font-semibold text-gray-300 mb-3.5 tracking-wider">
                Or Enter Magnet Link
            </label>
            <input
                id="magnet-link"
                type="text"
                className="w-full px-3 py-2 rounded-md bg-gray-700 text-gray-300 text-xs lg:text-sm"
                value={magnetLink || ''}
                onChange={handleMagnetLinkChange}
                placeholder="Paste magnet link here"
            />
        </div>

        {file && (
            <p className="text-xs lg:text-sm text-gray-400 mb-3 sm:mb-4 shadow-sm">Selected file: {file.name}</p>
        )}

        <button
            onClick={handleUpload}
            disabled={!file && !magnetLink}
            className="w-full py-2 sm:py-3 px-3 sm:px-4 border border-transparent rounded-lg shadow-lg text-xs lg:text-sm font-medium text-white tracking-wider bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 transition-all duration-200"
        >
            Upload Torrent File or Magnet Link
        </button>
    </>
);

export default UploadForm;