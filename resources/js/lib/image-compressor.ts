/**
 * Client-side fast image compressor and converter to WebP format.
 * Medium compression quality (0.72) with max dimensions of 1280px ensures
 * maximum clarity for healthcare field reports while reducing file size by 85-95%.
 */

export type CompressedImageResult = {
    file: File;
    blob: Blob;
    dataUrl: string;
    originalSize: number;
    compressedSize: number;
    reductionPercent: number;
    dimensions: { width: number; height: number };
};

export type CompressionOptions = {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0.0 to 1.0 (0.72 is ideal medium)
};

export async function compressImageToWebp(
    sourceFile: File,
    options: CompressionOptions = {},
): Promise<CompressedImageResult> {
    const { maxWidth = 1280, maxHeight = 1280, quality = 0.72 } = options;

    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.onload = (readerEvent) => {
            const img = new Image();

            img.onerror = () => reject(new Error('Failed to decode image'));
            img.onload = () => {
                let { width, height } = img;

                // Scale down while maintaining aspect ratio
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas 2D context not available'));
                    return;
                }

                // Smooth bicubic resampling
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to WebP format with medium quality (0.72)
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Failed to compress image to WebP'));
                            return;
                        }

                        const cleanBaseName = sourceFile.name.replace(
                            /\.[^/.]+$/,
                            '',
                        );
                        const webpFileName = `${cleanBaseName || 'photo'}.webp`;

                        const compressedFile = new File([blob], webpFileName, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });

                        const originalSize = sourceFile.size;
                        const compressedSize = blob.size;
                        const reductionPercent = Math.max(
                            0,
                            Math.round(
                                ((originalSize - compressedSize) /
                                    originalSize) *
                                    100,
                            ),
                        );

                        const dataUrl = canvas.toDataURL('image/webp', quality);

                        resolve({
                            file: compressedFile,
                            blob,
                            dataUrl,
                            originalSize,
                            compressedSize,
                            reductionPercent,
                            dimensions: { width, height },
                        });
                    },
                    'image/webp',
                    quality,
                );
            };

            if (typeof readerEvent.target?.result === 'string') {
                img.src = readerEvent.target.result;
            } else {
                reject(new Error('Invalid image file format'));
            }
        };

        reader.readAsDataURL(sourceFile);
    });
}

export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
