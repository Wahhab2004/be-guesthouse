"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = exports.uploadPhoto = exports.uploadProof = void 0;
const multer_1 = __importDefault(require("multer"));
const multer_storage_cloudinary_1 = require("multer-storage-cloudinary");
const cloudinary_1 = __importDefault(require("./cloudinary"));
const createStorage = (folderName, publicIdPrefix) => {
    return new multer_storage_cloudinary_1.CloudinaryStorage({
        cloudinary: cloudinary_1.default,
        params: {
            folder: `guesthouse/${folderName}`,
            allowed_formats: ["jpg", "jpeg", "png", "webp"],
            public_id: (_req, file) => {
                return `${publicIdPrefix}-${Date.now()}`;
            },
        },
    });
};
// Upload untuk bukti pembayaran (proof)
exports.uploadProof = (0, multer_1.default)({ storage: createStorage("proof", "proof") });
// Upload untuk foto kamar (photo)
exports.uploadPhoto = (0, multer_1.default)({ storage: createStorage("photos", "photo") });
// Jika perlu upload umum, bisa gunakan salah satu
exports.upload = exports.uploadProof;
