import { BadRequestException } from '@nestjs/common';
import multer, { memoryStorage } from 'multer'; // ✅ đúng sau khi cài

export const multerConfig = {
  storage: memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Chỉ chấp nhận file ảnh jpg, jpeg, png, gif, webp'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
