import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadZone } from './ImageUploadZone';

interface PortfolioUploadProps {
    onUploadSuccess: () => void;
}

const PortfolioUpload = ({ onUploadSuccess }: PortfolioUploadProps) => {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const handleFilesSelected = async (files: File[]) => {
        setIsUploading(true);
        setUploadError(null);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('images', file);
        });

        try {
            const response = await fetch('/api/images/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to upload files.');
            }

            toast({
                title: 'Upload Successful',
                description: `${data.uploadedCount} file(s) uploaded to your portfolio.`,
            });

            onUploadSuccess(); // Notify parent component to refresh stats/images

        } catch (err: any) {
            setUploadError(err.message || 'An unknown error occurred during upload.');
            toast({
                title: 'Upload Failed',
                description: err.message || 'An unknown error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Upload Images to Portfolio
                </CardTitle>
                <CardDescription>
                    Upload single images or a ZIP file containing multiple images.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {uploadError && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                )}
                <ImageUploadZone
                    onFilesSelected={handleFilesSelected}
                    disabled={isUploading}
                />
            </CardContent>
        </Card>
    );
};

export default PortfolioUpload;