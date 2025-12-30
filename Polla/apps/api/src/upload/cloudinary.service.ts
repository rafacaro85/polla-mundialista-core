import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
    async uploadImage(file: any): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    folder: 'la-polla-virtual',
                    transformation: [
                        { width: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
                    ],
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result!);
                },
            );

            streamifier.createReadStream(file.buffer).pipe(upload);
        });
    }
}
