'use client';

import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploaderProps {
    category: 'driver_document' | 'vehicle_photo' | 'cargo_photo' | 'profile_photo';
    maxFiles?: number;
    accept?: string;
    onUploadComplete?: (urls: string[]) => void;
}

export default function FileUploader({
    category,
    maxFiles = 1,
    accept = 'image/*',
    onUploadComplete,
}: FileUploaderProps) {
    const { toast } = useToast();
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const generateUploadUrl = useMutation(api.fileUpload.generateUploadUrl);
    const saveFileMetadata = useMutation(api.fileUpload.saveFileMetadata);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);

        if (selectedFiles.length + files.length > maxFiles) {
            toast({
                title: 'Too many files',
                description: `Maximum ${maxFiles} file(s) allowed`,
                variant: 'destructive',
            });
            return;
        }

        // Validate file size (5MB max)
        const invalidFiles = selectedFiles.filter(f => f.size > 5 * 1024 * 1024);
        if (invalidFiles.length > 0) {
            toast({
                title: 'File too large',
                description: 'Maximum file size is 5MB',
                variant: 'destructive',
            });
            return;
        }

        setFiles([...files, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const uploadFiles = async () => {
        if (files.length === 0) return;

        setUploading(true);
        const urls: string[] = [];

        try {
            for (const file of files) {
                // Step 1: Get upload URL
                const uploadUrl = await generateUploadUrl();

                // Step 2: Upload file to Convex storage
                const result = await fetch(uploadUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': file.type },
                    body: file,
                });

                const { storageId } = await result.json();

                // Step 3: Save metadata
                const metadata = await saveFileMetadata({
                    storageId,
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    category,
                });

                if (metadata.url) {
                    urls.push(metadata.url);
                }
            }

            setUploadedUrls(urls);
            setFiles([]);

            toast({
                title: 'Upload successful',
                description: `${urls.length} file(s) uploaded`,
            });

            if (onUploadComplete) {
                onUploadComplete(urls);
            }
        } catch (error: any) {
            toast({
                title: 'Upload failed',
                description: error.message || 'Failed to upload files',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Upload Button */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-bebax-green hover:bg-bebax-green-light transition-all"
            >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-700 font-medium mb-1">Click to upload</p>
                <p className="text-sm text-gray-500">
                    {accept === 'image/*' ? 'Images only' : 'Images or PDFs'} • Max {maxFiles} file(s) • 5MB each
                </p>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    multiple={maxFiles > 1}
                    onChange={handleFileSelect}
                    className="hidden"
                />
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-bebax-green-light rounded-lg flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-bebax-green" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={uploadFiles}
                        disabled={uploading}
                        className="w-full btn-bebax-primary flex items-center justify-center space-x-2"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-5 h-5" />
                                <span>Upload {files.length} file(s)</span>
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Uploaded Files */}
            {uploadedUrls.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Uploaded:</p>
                    {uploadedUrls.map((url, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl"
                        >
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-sm text-green-900 flex-1">File {index + 1} uploaded</p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-bebax-green hover:underline"
                            >
                                View
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
