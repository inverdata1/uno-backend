import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const body = req.body as Record<string, any>;
          const productName = String(body.productName || 'product').replace(/\s+/g, '_');
          const businessId = String(body.businessId || 'business').replace(/\s+/g, '_');
          const uniqueSuffix = Date.now();
          const ext = extname(file.originalname);
          cb(null, `${productName}_${businessId}_${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return { url: `/uploads/${file.filename}` };
  }

  @Post('video')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const body = req.body as Record<string, any>;
          const productName = String(body.productName || 'product').replace(/\s+/g, '_');
          const businessId = String(body.businessId || 'business').replace(/\s+/g, '_');
          const uniqueSuffix = Date.now();
          const ext = extname(file.originalname);
          cb(null, `${productName}_${businessId}_${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(mp4|webm|ogg|quicktime)$/)) {
          return cb(
            new BadRequestException('Only video files are allowed!'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return { url: `/uploads/${file.filename}` };
  }
}
