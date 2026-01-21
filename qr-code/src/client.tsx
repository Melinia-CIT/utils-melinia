import { render } from 'hono/jsx/dom'
import { useState, useRef } from 'hono/jsx'
import QRCode, { type QRCodeHandle } from './components/QRCode'
import type { DotType, CornerSquareType, CornerDotType, TypeNumber, ErrorCorrectionLevel, Extension } from 'qr-code-styling'

const App = () => {
    const [userId, setUserId] = useState("12345");
    const [dotsType, setDotsType] = useState<DotType>('dots');
    const [dotsColor, setDotsColor] = useState('#ffffff');
    const [backgroundColor, setBackgroundColor] = useState('#000000');
    const [cornersSquareType, setCornersSquareType] = useState<CornerSquareType>('extra-rounded');
    const [cornersSquareColor, setCornersSquareColor] = useState('#ffffff');
    const [cornersDotType, setCornersDotType] = useState<CornerDotType>('dot');
    const [cornersDotColor, setCornersDotColor] = useState('#ffffff');

    // New Options
    const [logoFile, setLogoFile] = useState<string | undefined>(undefined);
    const [typeNumber, setTypeNumber] = useState<number>(0); // 0 = Auto
    const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<ErrorCorrectionLevel>('Q');
    const [downloadSize, setDownloadSize] = useState<number>(2000);
    const [downloadExtension, setDownloadExtension] = useState<Extension>('png');

    const qrRef = useRef<QRCodeHandle>(null);

    const handleLogoUpload = (e: any) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoFile(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setLogoFile(undefined);
        }
    };

    const handleDownload = () => {
        qrRef.current?.download(`qrcode`, downloadExtension, downloadSize);
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
            <div className="w-full md:w-1/3 p-6 bg-white shadow-lg overflow-y-auto z-10">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">QR Code Settings</h1>

                {/* User ID */}
                 <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-gray-700">User ID</label>
                    <input
                        type="text"
                        value={userId}
                        onInput={(e) => setUserId((e.target as HTMLInputElement).value)}
                        className="w-full p-2 border rounded border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                </div>

                {/* Logo Upload */}
                <div className="mb-6 p-4 border rounded bg-gray-50 border-gray-200">
                    <h3 className="font-semibold mb-3 text-gray-800">Logo</h3>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">Upload Image</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="w-full p-2 border rounded bg-white border-gray-300 text-sm"
                        />
                         {logoFile && (
                            <button
                                onClick={() => setLogoFile(undefined)}
                                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                            >
                                Remove Logo
                            </button>
                        )}
                    </div>
                </div>

                {/* Density / Quality */}
                <div className="mb-6 p-4 border rounded bg-gray-50 border-gray-200">
                    <h3 className="font-semibold mb-3 text-gray-800">Density & Quality</h3>
                    <div className="mb-3">
                        <label className="block text-sm mb-1 text-gray-600">Error Correction (Density)</label>
                        <select
                            value={errorCorrectionLevel}
                            onChange={(e) => setErrorCorrectionLevel((e.target as HTMLSelectElement).value as ErrorCorrectionLevel)}
                            className="w-full p-2 border rounded bg-white border-gray-300"
                        >
                            <option value="L">Low (7%)</option>
                            <option value="M">Medium (15%)</option>
                            <option value="Q">Quartile (25%)</option>
                            <option value="H">High (30%)</option>
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm mb-1 text-gray-600">Version (0 = Auto)</label>
                         <input
                            type="number"
                            min="0"
                            max="40"
                            value={typeNumber}
                            onInput={(e) => setTypeNumber(parseInt((e.target as HTMLInputElement).value) || 0)}
                            className="w-full p-2 border rounded border-gray-300"
                         />
                    </div>
                </div>

                {/* Dots */}
                <div className="mb-6 p-4 border rounded bg-gray-50 border-gray-200">
                    <h3 className="font-semibold mb-3 text-gray-800">Dots</h3>
                    <div className="mb-3">
                        <label className="block text-sm mb-1 text-gray-600">Type</label>
                        <select
                            value={dotsType}
                            onChange={(e) => setDotsType((e.target as HTMLSelectElement).value as DotType)}
                            className="w-full p-2 border rounded bg-white border-gray-300"
                        >
                            <option value="dots">Dots</option>
                            <option value="rounded">Rounded</option>
                            <option value="classy">Classy</option>
                            <option value="classy-rounded">Classy Rounded</option>
                            <option value="square">Square</option>
                            <option value="extra-rounded">Extra Rounded</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={dotsColor}
                                onInput={(e) => setDotsColor((e.target as HTMLInputElement).value)}
                                className="h-10 w-10 cursor-pointer border-0 p-0 rounded overflow-hidden"
                            />
                            <span className="text-sm text-gray-500 font-mono">{dotsColor}</span>
                        </div>
                    </div>
                </div>

                {/* Background */}
                <div className="mb-6 p-4 border rounded bg-gray-50 border-gray-200">
                    <h3 className="font-semibold mb-3 text-gray-800">Background</h3>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">Color</label>
                        <div className="flex items-center gap-2">
                           <input
                                type="color"
                                value={backgroundColor}
                                onInput={(e) => setBackgroundColor((e.target as HTMLInputElement).value)}
                                className="h-10 w-10 cursor-pointer border-0 p-0 rounded overflow-hidden"
                            />
                            <span className="text-sm text-gray-500 font-mono">{backgroundColor}</span>
                        </div>
                    </div>
                </div>

                {/* Corners Square */}
                <div className="mb-6 p-4 border rounded bg-gray-50 border-gray-200">
                    <h3 className="font-semibold mb-3 text-gray-800">Corners Square</h3>
                    <div className="mb-3">
                        <label className="block text-sm mb-1 text-gray-600">Type</label>
                        <select
                            value={cornersSquareType}
                            onChange={(e) => setCornersSquareType((e.target as HTMLSelectElement).value as CornerSquareType)}
                            className="w-full p-2 border rounded bg-white border-gray-300"
                        >
                            <option value="dot">Dot</option>
                            <option value="square">Square</option>
                            <option value="extra-rounded">Extra Rounded</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">Color</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={cornersSquareColor}
                                onInput={(e) => setCornersSquareColor((e.target as HTMLInputElement).value)}
                                className="h-10 w-10 cursor-pointer border-0 p-0 rounded overflow-hidden"
                            />
                            <span className="text-sm text-gray-500 font-mono">{cornersSquareColor}</span>
                        </div>
                    </div>
                </div>

                {/* Corners Dot */}
                <div className="mb-6 p-4 border rounded bg-gray-50 border-gray-200">
                    <h3 className="font-semibold mb-3 text-gray-800">Corners Dot</h3>
                    <div className="mb-3">
                        <label className="block text-sm mb-1 text-gray-600">Type</label>
                        <select
                            value={cornersDotType}
                            onChange={(e) => setCornersDotType((e.target as HTMLSelectElement).value as CornerDotType)}
                            className="w-full p-2 border rounded bg-white border-gray-300"
                        >
                            <option value="dot">Dot</option>
                            <option value="square">Square</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">Color</label>
                         <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={cornersDotColor}
                                onInput={(e) => setCornersDotColor((e.target as HTMLInputElement).value)}
                                className="h-10 w-10 cursor-pointer border-0 p-0 rounded overflow-hidden"
                            />
                            <span className="text-sm text-gray-500 font-mono">{cornersDotColor}</span>
                        </div>
                    </div>
                </div>

                {/* Download */}
                <div className="mb-6 p-4 border rounded bg-blue-50 border-blue-200">
                    <h3 className="font-semibold mb-3 text-blue-800">Download</h3>
                    <div className="mb-3">
                         <label className="block text-sm mb-1 text-gray-600">Size (px)</label>
                         <input
                            type="number"
                            min="100"
                            max="5000"
                            value={downloadSize}
                            onInput={(e) => setDownloadSize(parseInt((e.target as HTMLInputElement).value))}
                            className="w-full p-2 border rounded border-gray-300"
                         />
                    </div>
                    <div className="mb-3">
                         <label className="block text-sm mb-1 text-gray-600">Format</label>
                        <select
                            value={downloadExtension}
                            onChange={(e) => setDownloadExtension((e.target as HTMLSelectElement).value as Extension)}
                            className="w-full p-2 border rounded bg-white border-gray-300"
                        >
                            <option value="png">PNG</option>
                            <option value="jpeg">JPEG</option>
                            <option value="webp">WEBP</option>
                            <option value="svg">SVG</option>
                        </select>
                    </div>
                    <button
                        onClick={handleDownload}
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition shadow"
                    >
                        Download QR Code
                    </button>
                </div>
            </div>

            <div className="flex-1 flex justify-center items-center p-10 bg-gray-200">
                <div className="p-4 rounded shadow-xl flex items-center justify-center transition-colors duration-300" style={{ width: '400px', height: '400px', backgroundColor: backgroundColor }}>
                    <div style={{ width: '368px', height: '368px' }}>
                        <QRCode
                            ref={qrRef}
                            userId={userId}
                            userName="Test User"
                            logoUrl={logoFile}
                            size={368} // 400 - 32 padding
                            dotsType={dotsType}
                            dotsColor={dotsColor}
                            backgroundColor={backgroundColor}
                            cornersSquareType={cornersSquareType}
                            cornersSquareColor={cornersSquareColor}
                            cornersDotType={cornersDotType}
                            cornersDotColor={cornersDotColor}
                            typeNumber={typeNumber === 0 ? undefined : (typeNumber as TypeNumber)}
                            errorCorrectionLevel={errorCorrectionLevel}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

const root = document.getElementById('root');
if (root) {
    render(<App />, root);
}
