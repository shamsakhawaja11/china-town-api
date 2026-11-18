import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { diskStorage } from 'multer';
import { join } from 'node:path';
import { Roles } from '../../common/decorators/roles.decorator';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

@Controller('admin/uploads')
@Roles('admin')
export class UploadsController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads'),
        filename: (_req, file, callback) => {
          const extension = ALLOWED_TYPES[file.mimetype];
          callback(null, `${randomUUID()}${extension}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_TYPES[file.mimetype]) {
          callback(
            new BadRequestException('Only JPEG, PNG or WebP images are allowed'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) {
      throw new BadRequestException('No file was uploaded (use the field name "file")');
    }
   
    return { path: `/uploads/${file.filename}` };
  }
}