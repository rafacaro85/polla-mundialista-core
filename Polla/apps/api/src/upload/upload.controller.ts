import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from './cloudinary.service';

@Controller('upload')
export class UploadController {
    private readonly logger = new Logger(UploadController.name);

    constructor(private readonly cloudinaryService: CloudinaryService) { }

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB
            },
            fileFilter: (req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
                    return cb(new BadRequestException('Only image files are allowed!'), false);
                }
                cb(null, true);
            },
        }),
    )
    async uploadFile(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        this.logger.log(`CLOUDINARY MODE: Attempting to upload file: ${file.originalname}`);

        try {
            const result = await this.cloudinaryService.uploadImage(file);
            this.logger.log(`SUCCESS: File uploaded to Cloudinary. URL: ${result.secure_url}`);
            return { url: result.secure_url };
        } catch (error: any) {
            this.logger.error(`CRITICAL CLOUDINARY UPLOAD ERROR: ${error.message}`);
            throw new InternalServerErrorException({
                message: 'Error al subir la imagen a Cloudinary',
                detail: error.message,
            });
        }
    }
}
