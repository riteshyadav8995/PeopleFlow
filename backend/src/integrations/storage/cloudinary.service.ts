import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../../config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET
});

export class CloudinaryService {
  /**
   * Uploads a file buffer to Cloudinary
   */
  async uploadBuffer(buffer: Buffer, folder: string, filename?: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename,
          resource_type: 'auto'
        },
        (error, result) => {
          if (error) return reject(error);
          if (result) return resolve(result);
          reject(new Error('Unknown upload error'));
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Deletes a file from Cloudinary by its public ID
   */
  async deleteFile(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }
}
