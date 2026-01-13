import React from 'react';
import { Building2, Trophy } from 'lucide-react';
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
            {/* Nueva sección para imagen del premio */}
            <div className="md:col-span-2">
                <SectionTitle title="Imagen del Premio" subtitle="Muestra el gran premio (16:9)." />
                <ImageUploader
                    label="Premio Mayor"
                    preview={config.prizeImageUrl}
                    onChange={(e: any) => handleImageUpload('prizeImageUrl', e)}
                    uploading={uploadingState['prizeImageUrl']}
                    placeholderIcon={Trophy}
                    aspect="video"
                />
            </div>
        </div>
    );
};
