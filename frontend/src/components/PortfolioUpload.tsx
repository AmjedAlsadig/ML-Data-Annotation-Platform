import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, CheckCircle2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadZone } from './ImageUploadZone';

interface PortfolioUploadProps {
    onUploadSuccess: () => void;
}

interface UploadResponse {
    success: number;
    failed: number;
    duplicates: number;
    images: any[];
    errors: Array<{ filename: string; error: string }>;
    skippedDuplicates: Array<{
        filename: string;
        fileSize: number;
        existingImageId: string;
        reason: string;
    }>;
}

const PortfolioUpload = ({ onUploadSuccess }: PortfolioUploadProps) => {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

    const handleFilesSelected = async (files: File[]) => {
        setIsUploading(true);
        setUploadResult(null);

        const token = localStorage.getItem("authToken");

        if (!token) {
        throw new Error("User not authenticated");
        }

        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file);
        });

        try {
            const response = await fetch('/api/images/upload', {
                method: 'POST',
                //credentials: 'include',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Cache-Control": "no-store"
                },
                body: formData,
            });

            const data: UploadResponse = await response.json();

            if (!response.ok) {
                throw new Error(data.errors?.[0]?.error || 'Failed to upload files.');
            }

            setUploadResult(data);

            // Show toast based on results
            if (data.success > 0 && data.duplicates === 0 && data.failed === 0) {
                // All uploaded successfully
                toast({
                    title: '✅ Upload Successful',
                    description: `${data.success} image${data.success > 1 ? 's' : ''} uploaded successfully.`,
                });
            } else if (data.success === 0 && data.duplicates > 0 && data.failed === 0) {
                // All were duplicates
                toast({
                    title: '❌ All Files Skipped',
                    description: `${data.duplicates} duplicate image${data.duplicates > 1 ? 's' : ''} skipped. Files already exist.`,
                    variant: 'default',
                });
            } else if (data.success > 0 || data.duplicates > 0 || data.failed > 0) {
                // Mixed results
                const parts = [];
                if (data.success > 0) parts.push(`${data.success} uploaded`);
                if (data.duplicates > 0) parts.push(`${data.duplicates} duplicate${data.duplicates > 1 ? 's' : ''}`);
                if (data.failed > 0) parts.push(`${data.failed} failed`);
                
                toast({
                    title: 'Upload Complete',
                    description: parts.join(', '),
                    variant: data.failed > 0 ? 'destructive' : 'default',
                });
            }

            // Refresh parent if any files were successfully uploaded
            if (data.success > 0) {
                onUploadSuccess();
            }

        } catch (err: any) {
            setUploadResult({
                success: 0,
                failed: files.length,
                duplicates: 0,
                images: [],
                errors: [{ filename: 'Upload', error: err.message }],
                skippedDuplicates: []
            });
            
            toast({
                title: '❌ Upload Failed',
                description: err.message || 'An unknown error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Images to Portfolio
                </CardTitle>
                <CardDescription>
                    Upload single images or a ZIP file containing multiple images. Duplicates will be automatically detected and skipped.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Upload Results Summary */}
                {uploadResult && (
                    <div className="space-y-3">
                        {/* Success Alert */}
                        {uploadResult.success > 0 && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    <strong>{uploadResult.success}</strong> image{uploadResult.success > 1 ? 's' : ''} uploaded successfully
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Duplicates Alert */}
                        {uploadResult.duplicates > 0 && (
                            <Alert className="border-blue-200 bg-blue-50">
                                <Info className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    <div className="space-y-2">
                                        <div>
                                            <strong>{uploadResult.duplicates}</strong> duplicate image{uploadResult.duplicates > 1 ? 's' : ''} skipped (already exist)
                                        </div>
                                        {uploadResult.skippedDuplicates.length > 0 && (
                                            <details className="text-xs mt-2">
                                                <summary className="cursor-pointer hover:underline">
                                                    View skipped files
                                                </summary>
                                                <ul className="mt-2 space-y-1 pl-4">
                                                    {uploadResult.skippedDuplicates.map((dup, idx) => (
                                                        <li key={idx} className="list-disc">
                                                            {dup.filename} ({formatFileSize(dup.fileSize)})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </details>
                                        )}
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Errors Alert */}
                        {uploadResult.failed > 0 && uploadResult.errors.length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-2">
                                        <div>
                                            <strong>{uploadResult.failed}</strong> image{uploadResult.failed > 1 ? 's' : ''} failed to upload
                                        </div>
                                        <details className="text-xs mt-2">
                                            <summary className="cursor-pointer hover:underline">
                                                View errors
                                            </summary>
                                            <ul className="mt-2 space-y-1 pl-4">
                                                {uploadResult.errors.map((err, idx) => (
                                                    <li key={idx} className="list-disc">
                                                        {err.filename}: {err.error}
                                                    </li>
                                                ))}
                                            </ul>
                                        </details>
                                    </div>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Upload Zone */}
                <ImageUploadZone
                    onFilesSelected={handleFilesSelected}
                    disabled={isUploading}
                />
            </CardContent>
        </Card>
    );
};

export default PortfolioUpload;
