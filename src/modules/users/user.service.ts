import { Injectable, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import cloudinary from '../../utils/cloudinary.config';
import * as streamifier from 'streamifier';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepo: UsersRepository) {}

  async initBlankUser(accountId: string, fullName?: string) {
    // Accept string, ensure it's a valid ObjectId
    if (!accountId) throw new BadRequestException('accountId is required');
    const isValid = Types.ObjectId.isValid(accountId);
    if (!isValid) throw new BadRequestException('accountId must be a valid ObjectId');
    return this.usersRepo.initBlankUser(accountId, fullName);
  }

  async getMe(accountId?: string) {
    if (!accountId) throw new BadRequestException('accountId is required');
    return this.usersRepo.getByAccountId(accountId);
  }

  async updateMe(accountId: string, payload: any) {
    if (!accountId) throw new BadRequestException('accountId is required');
    
    // Convert cvId string to ObjectId if provided
    if (payload.cvId && typeof payload.cvId === 'string') {
      payload.cvId = new Types.ObjectId(payload.cvId);
    }
    
    return this.usersRepo.updateByAccountId(accountId, payload);
  }

  async uploadAvatar(accountId: string, file: Express.Multer.File) {
    if (!accountId) throw new BadRequestException('accountId is required');
    if (!file) throw new BadRequestException('File is required');
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          resource_type: 'image',
          use_filename: true,
          unique_filename: true,
          overwrite: true,
        },
        (error, res) => {
          if (error) return reject(error);
          resolve(res);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
    const url: string = result?.secure_url || '';
    return this.usersRepo.setAvatarByAccountId(accountId, url);
  }

  // CV-related methods
  async findById(userId: string) {
    if (!userId) throw new BadRequestException('userId is required');
    return this.usersRepo.findById(userId);
  }

  async saveCv(accountId: string, cvId: string, cvFields: any) {
    if (!accountId) throw new BadRequestException('accountId is required');
    if (!cvId) throw new BadRequestException('cvId is required');

    return this.usersRepo.updateByAccountId(accountId, {
      cvId: new Types.ObjectId(cvId),
      cvFields: cvFields || {}
    });
  }

  async getUserCv(accountId: string) {
    if (!accountId) throw new BadRequestException('accountId is required');
    const user = await this.usersRepo.getByAccountId(accountId);
    if (!user) throw new BadRequestException('User not found');

    return {
      cvId: user.cvId,
      cvFields: user.cvFields
    };
  }

  async deleteCv(accountId: string) {
    if (!accountId) throw new BadRequestException('accountId is required');
    return this.usersRepo.updateByAccountId(accountId, {
      cvId: null,
      cvFields: {}
    });
  }

  async getCvDataByAccountId(accountId: string) {
    if (!accountId) throw new BadRequestException('accountId is required');
    return this.usersRepo.getCvDataByAccountId(accountId);
  }
}
