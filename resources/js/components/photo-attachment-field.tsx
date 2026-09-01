import {
    Camera,
    CheckCircle2,
    Eye,
    FileImage,
    ImagePlus,
    Loader2,
    Sparkles,
    Trash2,
    UploadCloud,
    X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    compressImageToWebp,
    formatFileSize,
} from '@/lib/image-compressor';

type AttachedItem = {
    url: string;
    name: string;
    originalSize: number;
    compressedSize: number;
    reductionPercent: number;
};

type Props = {
    attachments: string[];
    onChange: (urls: string[]) => void;
    maxPhotos?: number;
    label?: string;
    description?: string;
};

export function PhotoAttachmentField({
    attachments = [],
    onChange,
    maxPhotos = 30,
    label = 'কার্যক্রমের ছবি (Photos)',
    description,
}: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
    const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);

    const handleFilesSelected = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) return;

        const remainingSlots = maxPhotos - attachments.length;
        if (remainingSlots <= 0) {
            alert(`সর্বোচ্চ ${maxPhotos}টি ছবি যোগ করা যাবে।`);
            return;
        }

        const filesToProcess = files.slice(0, remainingSlots);
        setIsUploading(true);
        setUploadProgress({ current: 0, total: filesToProcess.length });

        const tokenElement = document.querySelector(
            'meta[name="csrf-token"]',
        ) as HTMLMetaElement | null;
        const csrfToken = tokenElement?.content || '';

        const newlyUploadedUrls: string[] = [];

        try {
            // Process and upload in chunks of 3 for fast, reliable upload without hitting payload limits
            const chunkSize = 3;
            for (let i = 0; i < filesToProcess.length; i += chunkSize) {
                const chunk = filesToProcess.slice(i, i + chunkSize);
                const formData = new FormData();

                for (const file of chunk) {
                    try {
                        const compressed = await compressImageToWebp(file, {
                            maxWidth: 1280,
                            maxHeight: 1280,
                            quality: 0.72,
                        });
                        formData.append('photos[]', compressed.file);
                    } catch (e) {
                        console.warn('Compression fallback to original file:', e);
                        formData.append('photos[]', file);
                    }
                }

                const response = await fetch('/attachments/upload', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: formData,
                });

                if (!response.ok) {
                    const errJson = await response.json().catch(() => ({}));
                    throw new Error(errJson.message || 'Upload failed');
                }

                const data = await response.json();
                const urls: string[] = data.urls || [];
                newlyUploadedUrls.push(...urls);

                setUploadProgress({
                    current: Math.min(i + chunk.length, filesToProcess.length),
                    total: filesToProcess.length,
                });
            }

            if (newlyUploadedUrls.length > 0) {
                onChange([...attachments, ...newlyUploadedUrls]);
            }
        } catch (error) {
            console.error('Photo upload error:', error);
            if (newlyUploadedUrls.length > 0) {
                onChange([...attachments, ...newlyUploadedUrls]);
            }
            alert('কিছু ছবি আপলোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
        } finally {
            setIsUploading(false);
            setUploadProgress(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (cameraInputRef.current) cameraInputRef.current.value = '';
        }
    };

    const handleRemove = (indexToRemove: number) => {
        onChange(attachments.filter((_, idx) => idx !== indexToRemove));
    };

    return (
        <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/15 p-4">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <FileImage className="size-4 text-primary" />
                    {label}
                </span>
                {attachments.length > 0 ? (
                    <span className="text-[11px] font-medium text-muted-foreground">
                        {attachments.length} / {maxPhotos} টি যুক্ত হয়েছে
                    </span>
                ) : null}
            </div>

            {description ? (
                <p className="text-[11px] text-muted-foreground">{description}</p>
            ) : null}

            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFilesSelected}
            />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFilesSelected}
            />

            {attachments.length < maxPhotos ? (
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-xl text-xs h-9 font-medium"
                    >
                        {isUploading ? (
                            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <ImagePlus className="size-3.5 mr-1.5 text-primary" />
                        )}
                        গ্যালারি (Gallery)
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={() => cameraInputRef.current?.click()}
                        className="rounded-xl text-xs h-9 font-medium"
                    >
                        {isUploading ? (
                            <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <Camera className="size-3.5 mr-1.5 text-primary" />
                        )}
                        ক্যামেরা (Camera)
                    </Button>
                </div>
            ) : null}

            {isUploading ? (
                <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-2.5 text-xs text-primary font-medium">
                    <Loader2 className="size-4 animate-spin shrink-0" />
                    <span>
                        ছবি আপলোড হচ্ছে {uploadProgress ? `(${uploadProgress.current}/${uploadProgress.total})` : ''}...
                    </span>
                </div>
            ) : null}

            {attachments.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 pt-1">
                    {attachments.map((url, idx) => (
                        <div
                            key={url}
                            className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card shadow-2xs"
                        >
                            <img
                                src={url}
                                alt={`Photo ${idx + 1}`}
                                className="h-full w-full object-cover cursor-pointer"
                                onClick={() => setPreviewModalUrl(url)}
                            />

                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-xs hover:bg-destructive/90 transition-colors"
                                title="Remove photo"
                            >
                                <Trash2 className="size-3" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}

            <Dialog
                open={Boolean(previewModalUrl)}
                onOpenChange={(open) => !open && setPreviewModalUrl(null)}
            >
                <DialogContent className="max-w-2xl p-2 rounded-2xl border bg-black/95 text-white">
                    <DialogHeader className="p-2 flex flex-row items-center justify-between border-b border-white/10">
                        <DialogTitle className="text-sm font-semibold text-white">
                            ছবি প্রিভিউ (Photo Preview)
                        </DialogTitle>
                        <DialogDescription className="hidden">
                            Attachment preview
                        </DialogDescription>
                    </DialogHeader>

                    {previewModalUrl ? (
                        <div className="flex items-center justify-center p-2 max-h-[70vh]">
                            <img
                                src={previewModalUrl}
                                alt="Preview"
                                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain"
                            />
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </div>
    );
}
