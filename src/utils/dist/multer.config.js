"use strict";
exports.__esModule = true;
exports.multerConfig = void 0;
var common_1 = require("@nestjs/common");
var multer_1 = require("multer"); // ✅ đúng sau khi cài
exports.multerConfig = {
    storage: multer_1.memoryStorage(),
    fileFilter: function (req, file, cb) {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
            cb(null, true);
        }
        else {
            cb(new common_1.BadRequestException('Chỉ chấp nhận file ảnh jpg, jpeg, png, gif, webp'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024
    }
};
