import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor() {
        // Configuración directa y robusta
        const config = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
            api_key: process.env.CLOUDINARY_API_KEY?.trim(),
            api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
        };

        if (!config.cloud_name || !config.api_key || !config.api_secret) {
            this.logger.error('CRITICAL: Cloudinary credentials missing in environment variables!');
        } else {
            cloudinary.config(config);
            this.logger.log('Cloudinary Service configured successfully');
        }
    }

    async uploadImage(file: any): Promise<UploadApiResponse | UploadApiErrorResponse> {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            throw new InternalServerErrorException('Configuración de Cloudinary incompleta en el servidor');
        }

        return new Promise((resolve, reject) => {
            this.logger.log(`Uploading to Cloudinary: ${file.originalname} (${file.size} bytes)`);

            const upload = cloudinary.uploader.upload_stream(
                {
                    folder: 'la-polla-virtual',
                    resource_type: 'auto',
                    transformation: [
                        { width: 1000, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
                    ],
                },
                (error, result) => {
                    if (error) {
                        this.logger.error('CLOUDINARY ERROR DETAILS:', JSON.stringify(error, null, 2));
                        return reject(error);
                    }
                    this.logger.log(`SUCCESS: Image uploaded to ${result!.secure_url}`);
                    resolve(result!);
                },
            );

            streamifier.createReadStream(file.buffer).pipe(upload);
        });
    }
}
