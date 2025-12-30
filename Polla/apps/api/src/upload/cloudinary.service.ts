import { Injectable, Inject, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
    private readonly logger = new Logger(CloudinaryService.name);

    constructor(@Inject('CLOUDINARY') private cloudinaryConfig: any) {
        this.logger.log('Cloudinary Service Initialized with Config');
    }

    async uploadImage(file: any): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            this.logger.log(`Starting upload to Cloudinary for file: ${file.originalname}`);

            const upload = cloudinary.uploader.upload_stream(
                {
                    folder: 'la-polla-virtual',
                    transformation: [
                        { width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
                    ],
                },
                (error, result) => {
                    if (error) {
                        this.logger.error('Cloudinary Stream Error:', error);
                        return reject(error);
                    }
                    resolve(result!);
                },
            );

            streamifier.createReadStream(file.buffer).pipe(upload);
        });
    }
}
