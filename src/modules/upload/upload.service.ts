import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  async uploadImage(file: Express.Multer.File): Promise<{
    url: string;
    secure_url: string;
    public_id: string;
  }> {
    try {
      // Upload to cloudinary
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            folder: 'cv-samples',
            transformation: [
              { width: 800, height: 1000, crop: 'fill' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

      return {
        url: uploadResult.secure_url,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async uploadSiteAsset(file: Express.Multer.File): Promise<{
    url: string;
    secure_url: string;
    public_id: string;
  }> {
    try {
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'site-assets',
            resource_type: 'image',
            use_filename: true,
            unique_filename: true,
            overwrite: true,
            transformation: [
              { quality: 'auto', fetch_format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
      return {
        url: uploadResult.secure_url,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
      };
    } catch (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }
  }

  async uploadCvPdfToSupabase(file: Express.Multer.File, accountId: string): Promise<{ url: string }> {
    try {
      const url = (process.env.SUPABASE_URL as string) || (process.env.VITE_SUPABASE_URL as string);
      // Prefer service role; fallback to anon key if provided (requires permissive bucket policies)
      const supabaseKey =
        (process.env.SUPABASE_SERVICE_ROLE_KEY as string)
        || (process.env.SUPABASE_ANON_KEY as string)
        || (process.env.VITE_SUPABASE_ANON_KEY as string);
      const bucket = process.env.SUPABASE_BUCKET || process.env.VITE_SUPABASE_BUCKET || 'cvs';
      this.logger.log(`[uploadCvPdfToSupabase] urlSet=${Boolean(url)} keyType=${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'service_role' : ((process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) ? 'anon' : 'missing')} bucket=${bucket}`);
      if (!url || !supabaseKey) {
        throw new BadRequestException('Supabase env not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) on the server.');
      }
      const supabase = createClient(url, supabaseKey);
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.pdf`;
      const path = `users/${accountId}/${fileName}`;

      const { error: uploadError } = await supabase
        .storage
        .from(bucket)
        .upload(path, file.buffer, {
          contentType: 'application/pdf',
          upsert: false,
        });
      if (uploadError) {
        this.logger.error(`[uploadCvPdfToSupabase] Upload error: ${uploadError?.message || uploadError}`);
        throw uploadError;
      }

      const { data: signed, error: signError } = await supabase
        .storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days
      if (!signError && signed?.signedUrl) {
        return { url: signed.signedUrl };
      }
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      if (!data?.publicUrl) {
        this.logger.error('[uploadCvPdfToSupabase] Failed to obtain public URL from Supabase');
        throw new BadRequestException('Cannot get URL from Supabase');
      }
      return { url: data.publicUrl };
    } catch (e: any) {
      this.logger.error(`[uploadCvPdfToSupabase] Exception: ${e?.message || e}`, e?.stack);
      throw new BadRequestException(`Upload to Supabase failed: ${e?.message || e}`);
    }
  }
}
