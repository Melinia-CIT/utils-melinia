import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "hono/jsx";
import QRCodeStyling, { type TypeNumber, type DotType, type CornerSquareType, type CornerDotType, type ErrorCorrectionLevel, type Extension } from "qr-code-styling";

export interface QRCodeHandle {
    download: (name: string, extension: Extension, size?: number) => void;
}

interface QRCodeProps {
    userId: string;
    userName?: string;
    logoUrl?: string;
    size: number;
    dotsType?: DotType;
    dotsColor?: string;
    backgroundColor?: string;
    cornersSquareType?: CornerSquareType;
    cornersSquareColor?: string;
    cornersDotType?: CornerDotType;
    cornersDotColor?: string;
    typeNumber?: TypeNumber;
    errorCorrectionLevel?: ErrorCorrectionLevel;
}

// Helper to fetch logo
const fetchLogoAsBase64 = async (url: string): Promise<string> => {
    // If it's already a data URL, return it directly
    if (url.startsWith('data:')) return url;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to load logo");
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

function generateInitialsBase64(name?: string): string {
    const canvas = document.createElement("canvas");
    const size = 1000;
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${size * 0.5}px sans-serif`;

    const text = (name || "ID").slice(0, 2).toUpperCase();
    ctx.fillText(text, size / 2, size / 2);

    return canvas.toDataURL("image/png");
}

const QRCode = forwardRef<QRCodeHandle, QRCodeProps>(({
    userId,
    userName,
    logoUrl,
    size = 256,
    dotsType = "dots",
    dotsColor = "#fff",
    backgroundColor = "#000",
    cornersSquareType = "extra-rounded",
    cornersSquareColor = "#fff",
    cornersDotType = "dot",
    cornersDotColor = "#fff",
    typeNumber,
    errorCorrectionLevel = "Q"
}, ref) => {
    const qrRef = useRef<HTMLDivElement>(null);
    const qrInstance = useRef<QRCodeStyling | null>(null);

    // State to track the currently active image (Base64 string)
    const [activeImage, setActiveImage] = useState<string | undefined>(() =>
        generateInitialsBase64(userName)
    );

    useImperativeHandle(ref, () => ({
        download: async (name: string, extension: Extension, downloadSize?: number) => {
            if (!qrInstance.current) return;

            // Just assume we can set the width/height and download
            // We need to restore the size afterwards so the preview matches current container
            // The safest way is to know the current container width, or just re-trigger updateQR with strict width

            const currentWidth = qrRef.current?.getBoundingClientRect().width || size;

            if (downloadSize && downloadSize > 0) {
                 await qrInstance.current.update({
                     width: downloadSize,
                     height: downloadSize
                 });
            }

            await qrInstance.current.download({ name, extension });

            // Restore size
            if (downloadSize && downloadSize > 0) {
                 await qrInstance.current.update({
                     width: currentWidth,
                     height: currentWidth
                 });
            }
        }
    }));

    // Simple replacement for useQuery
    useEffect(() => {
        if (!logoUrl) return;

        let isMounted = true;
        fetchLogoAsBase64(logoUrl)
        // ... rest of useEffect matches previous ...
            .then((base64) => {
                if (isMounted) setActiveImage(base64);
            })
            .catch((err) => {
                console.error("Error loading logo:", err);
                // Fallback to initials if logo fails
                if (isMounted) setActiveImage(generateInitialsBase64(userName));
            });

        return () => {
            isMounted = false;
        };
    }, [logoUrl, userName]);

    useEffect(() => {
        if (!qrRef.current) return;

        // Initialize QRCodeStyling instance if needed
        if (!qrInstance.current) {
            qrInstance.current = new QRCodeStyling({
                type: "canvas",
                width: size,
                height: size,
                data: userId,
                margin: 8,
                qrOptions: {
                    typeNumber: (typeNumber || 0) as TypeNumber,
                    errorCorrectionLevel,
                },
                imageOptions: {
                    imageSize: 0.4,
                    margin: 10,
                    saveAsBlob: true,
                    hideBackgroundDots: true,
                },
                dotsOptions: { type: dotsType, color: dotsColor },
                backgroundOptions: { color: backgroundColor },
                cornersSquareOptions: { type: cornersSquareType, color: cornersSquareColor },
                cornersDotOptions: { type: cornersDotType, color: cornersDotColor },
            });
            // Initial append
            qrRef.current.innerHTML = "";
            qrInstance.current.append(qrRef.current);
        }

        const updateQR = (currentWidth: number) => {
            qrInstance.current?.update({
                data: userId,
                image: activeImage,
                width: currentWidth,
                height: currentWidth,
                qrOptions: {
                    typeNumber: (typeNumber || 0) as TypeNumber,
                    errorCorrectionLevel,
                },
                dotsOptions: { type: dotsType, color: dotsColor },
                backgroundOptions: { color: backgroundColor },
                cornersSquareOptions: { type: cornersSquareType, color: cornersSquareColor },
                cornersDotOptions: { type: cornersDotType, color: cornersDotColor },
            });
        };

        // Draw with current props
        updateQR(size);

        // Resize Observer
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width } = entry.contentRect;
                if (width > 0) {
                    updateQR(Math.floor(width));
                }
            }
        });

        resizeObserver.observe(qrRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [
        userId,
        activeImage,
        size,
        dotsType,
        dotsColor,
        backgroundColor,
        cornersSquareType,
        cornersSquareColor,
        cornersDotType,
        cornersDotColor,
        typeNumber,
        errorCorrectionLevel
    ]);

    return <div ref={qrRef} className="w-full h-full flex justify-center items-center" />;
});

export default QRCode;
