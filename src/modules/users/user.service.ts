import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { UsersRepository } from './repositories/users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import cloudinary from '../../utils/cloudinary.config';
import * as streamifier from 'streamifier';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    private readonly usersRepo: UsersRepository,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    // Drop legacy unique index on username if it still exists
    try {
      const indexes = await this.userModel.collection.indexes();
      const legacyUserName = indexes.find((i: any) => i?.name === 'username_1');
      if (legacyUserName) {
        await this.userModel.collection.dropIndex('username_1');
        // eslint-disable-next-line no-console
        console.log('[UsersService] Dropped legacy index username_1');
      }

      // Drop legacy unique index on email if it still exists
      const legacyEmail = indexes.find((i: any) => i?.name === 'email_1');
      if (legacyEmail) {
        await this.userModel.collection.dropIndex('email_1');
        // eslint-disable-next-line no-console
        console.log('[UsersService] Dropped legacy index email_1');
      }

      // Defensive: drop any index that references username or email keys
      for (const idx of indexes) {
        try {
          const key = (idx as any)?.key || {};
          const name = (idx as any)?.name;
          if ((key && (key.username || key.email)) && name && name !== 'accountId_1') {
            await this.userModel.collection.dropIndex(name);
            // eslint-disable-next-line no-console
            console.log('[UsersService] Dropped legacy index', name);
          }
        } catch {}
      }
    } catch (e: any) {
      // Ignore if index not found or cannot be dropped; not fatal
      // eslint-disable-next-line no-console
      console.warn('[UsersService] Could not drop legacy index username_1:', e?.message || e);
    }
  }

  async initBlankUser(accountId: string, fullName?: string) {
    // Accept string, ensure it's a valid ObjectId
    if (!accountId) throw new BadRequestException('accountId is required');
    const isValid = Types.ObjectId.isValid(accountId);
    if (!isValid) throw new BadRequestException('accountId must be a valid ObjectId');
    try {
      console.log('[UsersService] initBlankUser called for', accountId, 'fullName:', fullName);
      const res = await this.usersRepo.initBlankUser(accountId, fullName);
      console.log('[UsersService] initBlankUser result for', accountId, '->', res?._id);
      return res;
    } catch (e) {
      console.error('[UsersService] initBlankUser error for', accountId, e);
      throw e;
    }
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
