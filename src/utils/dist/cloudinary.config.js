"use strict";
exports.__esModule = true;
exports.cloudinaryConfig = void 0;
var cloudinary_1 = require("cloudinary");
exports.cloudinaryConfig = function () {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};
exports["default"] = cloudinary_1.v2;
