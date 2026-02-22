import React from 'react';
import { Building2, Image as ImageIcon } from 'lucide-react';
import { SectionTitle, ImageUploader } from './StudioUI';

interface AssetsTabProps {
    config: any;
    handleImageUpload: (key: string, e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    uploadingState: Record<string, boolean>;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({ config, handleImageUpload, uploadingState }) => {
    return (
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div>
                <SectionTitle title="Logotipo" subtitle="Logo (PNG transparente)." />
                <ImageUploader
                    label="Logo Corporativo"
                    preview={config.brandingLogoUrl}
                    onChange={(e: any) => handleImageUpload('brandingLogoUrl', e)}
                    uploading={uploadingState['brandingLogoUrl']}
                    placeholderIcon={Building2}
                />
            </div>
            <div className="md:col-span-2">
                <SectionTitle title="Fondo del Hero" subtitle="Imagen de fondo para la cabecera (Full HD recomendado)." />
                <ImageUploader
                    label="Fondo Principal"
                    preview={config.brandCoverUrl}
                    onChange={(e: any) => handleImageUpload('brandCoverUrl', e)}
                    uploading={uploadingState['brandCoverUrl']}
                    placeholderIcon={ImageIcon}
                    aspect="video"
                />
            </div>
        </div>
    );
};
