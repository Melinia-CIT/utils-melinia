import { render } from 'hono/jsx/dom'
import { useState, useRef } from 'hono/jsx'
import QRCode, { type QRCodeHandle, type GradientConfig } from './components/QRCode'
import type { DotType, CornerSquareType, CornerDotType, TypeNumber, ErrorCorrectionLevel, Extension, ShapeType } from 'qr-code-styling'

// Gradient picker component
const GradientPicker = ({ 
    enabled, 
    gradient, 
    onChange, 
    onToggle,
    label 
}: { 
    enabled: boolean;
    gradient: GradientConfig;
    onChange: (gradient: GradientConfig) => void;
    onToggle: (enabled: boolean) => void;
    label: string;
}) => {
    const updateColorStop = (index: number, color: string) => {
        const newStops = [...gradient.colorStops];
        newStops[index] = { ...newStops[index], color };
        onChange({ ...gradient, colorStops: newStops });
    };

    return (
        <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-200">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input 
                    type="checkbox" 
                    checked={enabled} 
                    onChange={(e) => onToggle((e.target as HTMLInputElement).checked)}
                    className="rounded"
                />
                Use Gradient
            </label>
            {enabled && (
                <div className="mt-2 space-y-2">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Type</label>
                        <select
                            value={gradient.type}
                            onChange={(e) => onChange({ ...gradient, type: (e.target as HTMLSelectElement).value as 'linear' | 'radial' })}
                            className="w-full p-1 text-sm border rounded bg-white border-gray-300"
                        >
                            <option value="linear">Linear</option>
                            <option value="radial">Radial</option>
                        </select>
                    </div>
                    {gradient.type === 'linear' && (
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Rotation: {gradient.rotation}°</label>
                            <input
                                type="range"
                                min="0"
                                max="360"
                                value={gradient.rotation ?? 0}
                                onInput={(e) => onChange({ ...gradient, rotation: parseInt((e.target as HTMLInputElement).value) })}
                                className="w-full"
                            />
                        </div>
                    )}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Start Color</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="color"
                                    value={gradient.colorStops[0]?.color || '#ffffff'}
                                    onInput={(e) => updateColorStop(0, (e.target as HTMLInputElement).value)}
                                    className="h-8 w-8 cursor-pointer border-0 p-0 rounded"
                                />
                                <span className="text-xs font-mono text-gray-500">{gradient.colorStops[0]?.color}</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">End Color</label>
                            <div className="flex items-center gap-1">
                                <input
                                    type="color"
                                    value={gradient.colorStops[1]?.color || '#000000'}
                                    onInput={(e) => updateColorStop(1, (e.target as HTMLInputElement).value)}
                                    className="h-8 w-8 cursor-pointer border-0 p-0 rounded"
                                />
                                <span className="text-xs font-mono text-gray-500">{gradient.colorStops[1]?.color}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const App = () => {
    const [userId, setUserId] = useState("https://www.youtube.com/watch?v=xvFZjo5PgG0");
    
    // Dots options
    const [dotsType, setDotsType] = useState<DotType>('dots');
    const [dotsColor, setDotsColor] = useState('#ffffff');
    const [dotsGradientEnabled, setDotsGradientEnabled] = useState(false);
    const [dotsGradient, setDotsGradient] = useState<GradientConfig>({
        type: 'linear',
        rotation: 0,
        colorStops: [{ offset: 0, color: '#ff0000' }, { offset: 1, color: '#0000ff' }]
    });
    
    // Background options
    const [backgroundColor, setBackgroundColor] = useState('#000000');
    const [backgroundGradientEnabled, setBackgroundGradientEnabled] = useState(false);
    const [backgroundGradient, setBackgroundGradient] = useState<GradientConfig>({
        type: 'linear',
        rotation: 0,
        colorStops: [{ offset: 0, color: '#1a1a2e' }, { offset: 1, color: '#16213e' }]
    });
    const [transparentBackground, setTransparentBackground] = useState(false);
    
    // Corners Square options
    const [cornersSquareType, setCornersSquareType] = useState<CornerSquareType>('extra-rounded');
    const [cornersSquareColor, setCornersSquareColor] = useState('#ffffff');
    const [cornersSquareGradientEnabled, setCornersSquareGradientEnabled] = useState(false);
    const [cornersSquareGradient, setCornersSquareGradient] = useState<GradientConfig>({
        type: 'linear',
        rotation: 0,
        colorStops: [{ offset: 0, color: '#ff6b6b' }, { offset: 1, color: '#feca57' }]
    });
    
    // Corners Dot options
    const [cornersDotType, setCornersDotType] = useState<CornerDotType>('dot');
    const [cornersDotColor, setCornersDotColor] = useState('#ffffff');
    const [cornersDotGradientEnabled, setCornersDotGradientEnabled] = useState(false);
    const [cornersDotGradient, setCornersDotGradient] = useState<GradientConfig>({
        type: 'radial',
        rotation: 0,
        colorStops: [{ offset: 0, color: '#00d2d3' }, { offset: 1, color: '#54a0ff' }]
    });

    // New Options
    const [logoFile, setLogoFile] = useState<string | undefined>(undefined);
    const [typeNumber, setTypeNumber] = useState<number>(4);
    const [errorCorrectionLevel, setErrorCorrectionLevel] = useState<ErrorCorrectionLevel>('Q');
    const [downloadSize, setDownloadSize] = useState<number>(2000);
    const [downloadExtension, setDownloadExtension] = useState<Extension>('png');
    
    // Shape options
    const [shape, setShape] = useState<ShapeType>('square');
    
    // Image/Logo options
    const [imageSize, setImageSize] = useState(0.4);
    const [imageMargin, setImageMargin] = useState(10);
    
    // Margin options
    const [margin, setMargin] = useState(8);

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

    // Compute preview background color/style
    const getPreviewBackground = () => {
        if (transparentBackground) {
            return 'repeating-conic-gradient(#808080 0% 25%, #ffffff 0% 50%) 50% / 20px 20px';
        }
        if (backgroundGradientEnabled) {
            const { type, rotation, colorStops } = backgroundGradient;
            const colors = colorStops.map(s => s.color).join(', ');
            return type === 'radial' 
                ? `radial-gradient(circle, ${colors})`
                : `linear-gradient(${rotation}deg, ${colors})`;
        }
        return backgroundColor;
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-gray-100 font-sans">
            <div className="w-full md:w-1/3 p-6 bg-white shadow-lg overflow-y-auto z-10">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">QR Code Settings</h1>

                {/* User ID */}
                 <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-gray-700">Data / URL</label>
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
                    <div className="mb-3">
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
                    <div className="mb-3">
                        <label className="block text-sm mb-1 text-gray-600">Logo Size: {Math.round(imageSize * 100)}%</label>
                        <input
                            type="range"
                            min="0.1"
                            max="0.6"
                            step="0.05"
                            value={imageSize}
                            onInput={(e) => setImageSize(parseFloat((e.target as HTMLInputElement).value))}
                            className="w-full"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">Logo Margin: {imageMargin}px</label>
                        <input
                            type="range"
                            min="0"
                            max="30"
                            step="1"
                            value={imageMargin}
                            onInput={(e) => setImageMargin(parseInt((e.target as HTMLInputElement).value))}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Shape */}
                <div className="mb-6 p-4 border rounded bg-gray-50 border-gray-200">
                    <h3 className="font-semibold mb-3 text-gray-800">Shape</h3>
                    <div className="mb-3">
                        <label className="block text-sm mb-1 text-gray-600">QR Code Shape</label>
                        <select
                            value={shape}
                            onChange={(e) => setShape((e.target as HTMLSelectElement).value as ShapeType)}
                            className="w-full p-2 border rounded bg-white border-gray-300"
                        >
                            <option value="square">Square</option>
                            <option value="circle">Circle</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm mb-1 text-gray-600">Quiet Zone (Margin): {margin}px</label>
                        <input
                            type="range"
                            min="0"
                            max="50"
                            step="1"
                            value={margin}
                            onInput={(e) => setMargin(parseInt((e.target as HTMLInputElement).value))}
                            className="w-full"
                        />
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
                                disabled={dotsGradientEnabled}
                                className="h-10 w-10 cursor-pointer border-0 p-0 rounded overflow-hidden disabled:opacity-50"
                            />
                            <span className="text-sm text-gray-500 font-mono">{dotsColor}</span>
                        </div>
                    </div>
                    <GradientPicker
                        enabled={dotsGradientEnabled}
                        gradient={dotsGradient}
                        onChange={setDotsGradient}
                        onToggle={setDotsGradientEnabled}
                        label="Dots"
                    />
                </div>

                {/* Background */}
                <div className="mb-6 p-4 border rounded bg-gray-50 border-gray-200">
                    <h3 className="font-semibold mb-3 text-gray-800">Background</h3>
                    <div className="mb-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={transparentBackground} 
                                onChange={(e) => setTransparentBackground((e.target as HTMLInputElement).checked)}
                                className="rounded"
                            />
                            Transparent Background
                        </label>
                    </div>
                    {!transparentBackground && (
                        <>
                            <div>
                                <label className="block text-sm mb-1 text-gray-600">Color</label>
                                <div className="flex items-center gap-2">
                                   <input
                                        type="color"
                                        value={backgroundColor}
                                        onInput={(e) => setBackgroundColor((e.target as HTMLInputElement).value)}
                                        disabled={backgroundGradientEnabled}
                                        className="h-10 w-10 cursor-pointer border-0 p-0 rounded overflow-hidden disabled:opacity-50"
                                    />
                                    <span className="text-sm text-gray-500 font-mono">{backgroundColor}</span>
                                </div>
                            </div>
                            <GradientPicker
                                enabled={backgroundGradientEnabled}
                                gradient={backgroundGradient}
                                onChange={setBackgroundGradient}
                                onToggle={setBackgroundGradientEnabled}
                                label="Background"
                            />
                        </>
                    )}
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
                                disabled={cornersSquareGradientEnabled}
                                className="h-10 w-10 cursor-pointer border-0 p-0 rounded overflow-hidden disabled:opacity-50"
                            />
                            <span className="text-sm text-gray-500 font-mono">{cornersSquareColor}</span>
                        </div>
                    </div>
                    <GradientPicker
                        enabled={cornersSquareGradientEnabled}
                        gradient={cornersSquareGradient}
                        onChange={setCornersSquareGradient}
                        onToggle={setCornersSquareGradientEnabled}
                        label="Corners Square"
                    />
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
                                disabled={cornersDotGradientEnabled}
                                className="h-10 w-10 cursor-pointer border-0 p-0 rounded overflow-hidden disabled:opacity-50"
                            />
                            <span className="text-sm text-gray-500 font-mono">{cornersDotColor}</span>
                        </div>
                    </div>
                    <GradientPicker
                        enabled={cornersDotGradientEnabled}
                        gradient={cornersDotGradient}
                        onChange={setCornersDotGradient}
                        onToggle={setCornersDotGradientEnabled}
                        label="Corners Dot"
                    />
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
                <div 
                    className="p-4 rounded shadow-xl flex items-center justify-center transition-colors duration-300" 
                    style={{ 
                        width: '400px', 
                        height: '400px', 
                        background: getPreviewBackground()
                    }}
                >
                    <div style={{ width: '368px', height: '368px' }}>
                        <QRCode
                            ref={qrRef}
                            userId={userId}
                            userName="Test User"
                            logoUrl={logoFile}
                            size={468}
                            dotsType={dotsType}
                            dotsColor={dotsColor}
                            dotsGradient={dotsGradientEnabled ? dotsGradient : undefined}
                            backgroundColor={backgroundColor}
                            backgroundGradient={backgroundGradientEnabled ? backgroundGradient : undefined}
                            transparentBackground={transparentBackground}
                            cornersSquareType={cornersSquareType}
                            cornersSquareColor={cornersSquareColor}
                            cornersSquareGradient={cornersSquareGradientEnabled ? cornersSquareGradient : undefined}
                            cornersDotType={cornersDotType}
                            cornersDotColor={cornersDotColor}
                            cornersDotGradient={cornersDotGradientEnabled ? cornersDotGradient : undefined}
                            typeNumber={typeNumber === 0 ? undefined : (typeNumber as TypeNumber)}
                            errorCorrectionLevel={errorCorrectionLevel}
                            shape={shape}
                            imageSize={imageSize}
                            imageMargin={imageMargin}
                            margin={margin}
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
