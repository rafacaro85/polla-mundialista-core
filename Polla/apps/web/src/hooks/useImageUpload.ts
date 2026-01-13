import { useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const useImageUpload = () => {
    const { toast } = useToast();
    const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

    const handleImageUpload = async (
        key: string,
        e: React.ChangeEvent<HTMLInputElement>,
        onSuccess: (url: string) => void
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: 'Archivo muy pesado', description: 'Máximo 5MB.', variant: 'destructive' });
            return;
        }

        try {
            setUploadingState(prev => ({ ...prev, [key]: true }));
            const formData = new FormData();
            formData.append('file', file);

            // Upload to centralized endpoint
            const { data } = await api.post('/upload', formData);

            onSuccess(data.url);
            toast({ title: 'Imagen subida', description: 'Se ha actualizado la imagen correctamente.' });

        } catch (error) {
            console.error('Error uploading:', error);
            toast({ title: 'Error subiendo imagen', description: 'Intenta de nuevo.', variant: 'destructive' });
        } finally {
            setUploadingState(prev => ({ ...prev, [key]: false }));
        }
    };

    return {
        uploadingState,
        handleImageUpload
    };
};
