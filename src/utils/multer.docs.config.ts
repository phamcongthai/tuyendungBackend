import { BadRequestException } from '@nestjs/common';
import multer, { memoryStorage } from 'multer';

export const multerDocsConfig = {
	storage: memoryStorage(),
	fileFilter: (req, file, cb) => {
		const allowed = new Set<string>([
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/octet-stream', // fallback when browser cannot detect type
		]);
		const name = (file.originalname || '').toLowerCase();
		const extOk = name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
		if (allowed.has(file.mimetype) && extOk) return cb(null, true);
		if (file.mimetype === 'application/octet-stream' && extOk) return cb(null, true);
		return cb(new BadRequestException('Chỉ chấp nhận file .pdf, .doc, .docx'), false);
	},
	limits: {
		fileSize: 15 * 1024 * 1024, // 15MB
	},
};


