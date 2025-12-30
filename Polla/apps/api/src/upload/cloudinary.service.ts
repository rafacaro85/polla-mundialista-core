import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor() {
        const config = {
            cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || '').trim(),
            api_key: (process.env.CLOUDINARY_API_KEY || '').trim(),
            api_secret: (process.env.CLOUDINARY_API_SECRET || '').trim(),
        };

        if (!config.cloud_name) {
            this.logger.error('CRITICAL: Cloudinary credentials missing in environment variables!');
        } else {
            cloudinary.config(config);
            this.logger.log('Cloudinary Service configured successfully');
        }
    }

    async uploadImage(file: any): Promise<UploadApiResponse | UploadApiErrorResponse> {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            throw new InternalServerErrorException('Configuración de Cloudinary no encontrada');
        }

        try {
            this.logger.log(`Uploading to Cloudinary: ${file.originalname} (${file.size} bytes)`);

            // Convertir Buffer a Base64 para máxima compatibilidad
            const b64 = Buffer.from(file.buffer).toString('base64');
            const dataURI = `data:${file.mimetype};base64,${b64}`;

            const result = await cloudinary.uploader.upload(dataURI, {
                folder: 'la-polla-virtual',
                resource_type: 'auto',
                transformation: [
                    { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
                ],
            });

            this.logger.log(`SUCCESS: Image uploaded to ${result.secure_url}`);
            return result;
        } catch (error: any) {
            this.logger.error('CLOUDINARY UPLOAD ERROR:', error);
            throw error;
        }
    }
}
