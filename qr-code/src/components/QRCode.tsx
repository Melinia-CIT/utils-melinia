import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "hono/jsx";
import QRCodeStyling, { type TypeNumber, type DotType, type CornerSquareType, type CornerDotType, type ErrorCorrectionLevel, type Extension, type Gradient, type ShapeType } from "qr-code-styling";

export interface QRCodeHandle {
    download: (name: string, extension: Extension, size?: number) => void;
}

export interface GradientConfig {
    type: 'linear' | 'radial';
    rotation?: number; // 0-360 degrees for linear gradients
    colorStops: Array<{ offset: number; color: string }>;
}

interface QRCodeProps {
    userId: string;
    userName?: string;
    logoUrl?: string;
    size: number;
    // Dots options
    dotsType?: DotType;
    dotsColor?: string;
    dotsGradient?: GradientConfig;
    // Background options
    backgroundColor?: string;
    backgroundGradient?: GradientConfig;
    transparentBackground?: boolean;
    // Corners Square options
    cornersSquareType?: CornerSquareType;
    cornersSquareColor?: string;
    cornersSquareGradient?: GradientConfig;
    // Corners Dot options
    cornersDotType?: CornerDotType;
    cornersDotColor?: string;
    cornersDotGradient?: GradientConfig;
    // QR options
    typeNumber?: TypeNumber;
    errorCorrectionLevel?: ErrorCorrectionLevel;
    // Shape options
    shape?: ShapeType;
    // Image options
    imageSize?: number; // 0-1 (percentage of QR code)
    imageMargin?: number; // pixels
    // Margin/quiet zone
    margin?: number;
}

// Helper to convert GradientConfig to qr-code-styling Gradient format
const toQRGradient = (gradient: GradientConfig): Gradient => ({
    type: gradient.type,
    rotation: gradient.rotation ?? 0,
    colorStops: gradient.colorStops.map(stop => ({
        offset: stop.offset,
        color: stop.color
    }))
});

const DEFAULT_LOGO_URL = "https://cdn.melinia.in/melinia-qr-embed.png";

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

const QRCode = forwardRef<QRCodeHandle, QRCodeProps>(({
    userId,
    userName,
    logoUrl,
    size = 256,
    // Dots
    dotsType = "dots",
    dotsColor = "#fff",
    dotsGradient,
    // Background
    backgroundColor = "#000",
    backgroundGradient,
    transparentBackground = false,
    // Corners Square
    cornersSquareType = "extra-rounded",
    cornersSquareColor = "#fff",
    cornersSquareGradient,
    // Corners Dot
    cornersDotType = "dot",
    cornersDotColor = "#fff",
    cornersDotGradient,
    // QR options
    typeNumber,
    errorCorrectionLevel = "Q",
    // Shape
    shape = "square",
    // Image options
    imageSize = 0.4,
    imageMargin = 10,
    // Margin
    margin = 8,
}, ref) => {
    const qrRef = useRef<HTMLDivElement>(null);
    const qrInstance = useRef<QRCodeStyling | null>(null);

    // State to track the currently active image (Base64 string)
    const [activeImage, setActiveImage] = useState<string | undefined>(undefined);

    useImperativeHandle(ref, () => ({
        download: async (name: string, extension: Extension, downloadSize?: number) => {
            if (!qrInstance.current) return;

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

    // Load default logo or custom logo
    useEffect(() => {
        const urlToLoad = logoUrl || DEFAULT_LOGO_URL;
        
        let isMounted = true;
        fetchLogoAsBase64(urlToLoad)
            .then((base64) => {
                if (isMounted) setActiveImage(base64);
            })
            .catch((err) => {
                console.error("Error loading logo:", err);
                // If custom logo fails, try default logo
                if (isMounted && logoUrl) {
                    fetchLogoAsBase64(DEFAULT_LOGO_URL)
                        .then((base64) => {
                            if (isMounted) setActiveImage(base64);
                        })
                        .catch(() => {
                            if (isMounted) setActiveImage(undefined);
                        });
                }
            });

        return () => {
            isMounted = false;
        };
    }, [logoUrl]);

    useEffect(() => {
        if (!qrRef.current) return;

        // Build dots options with gradient support
        // Must explicitly set gradient to undefined when not using it to clear previous gradient
        const dotsOptions: any = { 
            type: dotsType, 
            color: dotsGradient ? undefined : dotsColor,
            gradient: dotsGradient ? toQRGradient(dotsGradient) : undefined
        };

        // Build background options with gradient/transparency support
        const backgroundOptions: any = transparentBackground 
            ? { color: 'transparent', gradient: undefined }
            : { 
                color: backgroundGradient ? undefined : backgroundColor,
                gradient: backgroundGradient ? toQRGradient(backgroundGradient) : undefined
            };

        // Build corners square options with gradient support
        const cornersSquareOptions: any = { 
            type: cornersSquareType, 
            color: cornersSquareGradient ? undefined : cornersSquareColor,
            gradient: cornersSquareGradient ? toQRGradient(cornersSquareGradient) : undefined
        };

        // Build corners dot options with gradient support
        const cornersDotOptions: any = { 
            type: cornersDotType, 
            color: cornersDotGradient ? undefined : cornersDotColor,
            gradient: cornersDotGradient ? toQRGradient(cornersDotGradient) : undefined
        };

        // Initialize QRCodeStyling instance if needed
        if (!qrInstance.current) {
            qrInstance.current = new QRCodeStyling({
                type: "canvas",
                shape,
                width: size,
                height: size,
                data: userId,
                margin,
                qrOptions: {
                    typeNumber: (typeNumber || 0) as TypeNumber,
                    errorCorrectionLevel,
                },
                imageOptions: {
                    imageSize,
                    margin: imageMargin,
                    saveAsBlob: true,
                    hideBackgroundDots: true,
                },
                dotsOptions,
                backgroundOptions,
                cornersSquareOptions,
                cornersDotOptions,
            });
            // Initial append
            qrRef.current.innerHTML = "";
            qrInstance.current.append(qrRef.current);
        }

        const updateQR = (currentWidth: number) => {
            qrInstance.current?.update({
                data: userId,
                image: activeImage,
                shape,
                width: currentWidth,
                height: currentWidth,
                margin,
                qrOptions: {
                    typeNumber: (typeNumber || 0) as TypeNumber,
                    errorCorrectionLevel,
                },
                imageOptions: {
                    imageSize,
                    margin: imageMargin,
                    saveAsBlob: true,
                    hideBackgroundDots: true,
                },
                dotsOptions,
                backgroundOptions,
                cornersSquareOptions,
                cornersDotOptions,
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
        dotsGradient,
        backgroundColor,
        backgroundGradient,
        transparentBackground,
        cornersSquareType,
        cornersSquareColor,
        cornersSquareGradient,
        cornersDotType,
        cornersDotColor,
        cornersDotGradient,
        typeNumber,
        errorCorrectionLevel,
        shape,
        imageSize,
        imageMargin,
        margin,
    ]);

    return <div ref={qrRef} className="w-full h-full flex justify-center items-center" />;
});

export default QRCode;
