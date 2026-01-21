import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary";

const createStorage = (folderName: string, publicIdPrefix: string) => {
	return new CloudinaryStorage({
		cloudinary,
		params: {
			folder: `guesthouse/${folderName}`,
			allowed_formats: ["jpg", "jpeg", "png", "webp"],
			public_id: (_req: any, file: any) => {
				return `${publicIdPrefix}-${Date.now()}`;
			},
		} as any, 
	});
};

// Upload untuk bukti pembayaran (proof)
export const uploadProof = multer({ storage: createStorage("proof", "proof") });

// Upload untuk foto kamar (photo)
export const uploadPhoto = multer({ storage: createStorage("photos", "photo") });

// Jika perlu upload umum, bisa gunakan salah satu
export const upload = uploadProof;
