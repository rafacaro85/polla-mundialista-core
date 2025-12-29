import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException, Logger, ForbiddenException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

@Controller('upload')
export class UploadController {
    private readonly logger = new Logger(UploadController.name);

    @Post()
    @UseInterceptors(FileInterceptor('file', {
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
    }))
    async uploadFile(@UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const uploadPath = join(process.cwd(), 'uploads');
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        const filename = `${randomName}${extname(file.originalname || '.jpg')}`;
        const fullPath = join(uploadPath, filename);

        this.logger.log(`PARANOID MODE: Attempting to write to: ${fullPath}`);

        try {
            // 1. Verificar/Crear carpeta manualmente
            if (!fs.existsSync(uploadPath)) {
                this.logger.log(`Creating directory: ${uploadPath}`);
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            // 2. Escribir archivo manualmente
            fs.writeFileSync(fullPath, file.buffer);

            this.logger.log(`SUCCESS: File written to ${fullPath}`);

            const apiUrl = process.env.RAILWAY_PUBLIC_DOMAIN
                ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
                : (process.env.API_URL || 'http://localhost:3000');

            return { url: `${apiUrl}/uploads/${filename}` };

        } catch (error: any) {
            this.logger.error(`CRITICAL UPLOAD ERROR: ${error.message}`);

            if (error.code === 'EACCES') {
                throw new ForbiddenException({
                    message: 'El servidor no tiene permisos de escritura en esta carpeta',
                    path: fullPath,
                    error: error.code
                });
            }

            throw new InternalServerErrorException({
                message: 'Error interno al escribir el archivo',
                detail: error.message,
                code: error.code,
                path: fullPath
            });
        }
    }
}
