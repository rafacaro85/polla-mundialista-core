import React from 'react';
import { Building2, Image as ImageIcon, Lock } from 'lucide-react';
import { SectionTitle, ImageUploader } from './StudioUI';

interface AssetsTabProps {
    config: any;
    handleImageUpload: (key: string, e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    uploadingState: Record<string, boolean>;
    planLevel?: number;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({ config, handleImageUpload, uploadingState, planLevel = 0 }) => {
    console.log('[AssetsTab] planLevel:', planLevel, '| packageType:', config.packageType);

    return (
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            <div className={`relative ${planLevel < 2 ? 'opacity-50' : ''}`}>
                <SectionTitle title="Logotipo" subtitle="Logo (PNG transparente)." />
                {planLevel < 2 && (
                    <div className="absolute inset-0 z-10 bg-black/50 flex items-center justify-center backdrop-blur-[1px] rounded-2xl">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/80 rounded-full border border-yellow-500/30 text-yellow-500">
                            <Lock size={12} /> <span className="text-[10px] font-bold uppercase tracking-wider">Plan Bronce Requerido</span>
                        </div>
                    </div>
                )}
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
