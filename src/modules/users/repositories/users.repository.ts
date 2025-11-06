import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schema/user.schema';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import cloudinary from '../../../utils/cloudinary.config';
import * as streamifier from 'streamifier';

@Injectable()
export class UsersRepository {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<UserDocument>,
	) {}

	async initBlankUser(accountId: string, fullName?: string) {
		if (!accountId) {
			throw new BadRequestException('accountId is required');
		}
		const accountObjectId = new Types.ObjectId(accountId);
		const existing = await this.userModel.findOne({ accountId: accountObjectId });
		if (existing) {
			return existing;
		}
		const safeFullName = (fullName && fullName.trim().length > 0) ? fullName.trim() : 'Người dùng';
		const created = await this.userModel.create({
			accountId: accountObjectId,
			avatar: null,
			dateOfBirth: null,
			gender: 'other',
			city: null,
			desiredPosition: null,
			summaryExperience: null,
			skills: [],
		});
		return created;
	}

	async getByAccountId(accountId: string) {
		const accountObjectId = new Types.ObjectId(accountId);
		const user = await this.userModel.findOne({ accountId: accountObjectId });
		if (!user) throw new BadRequestException('User not found');
		return user;
	}

	async findById(userId: string) {
		const userObjectId = new Types.ObjectId(userId);
		const user = await this.userModel.findById(userObjectId);
		if (!user) throw new BadRequestException('User not found');
		return user;
	}

	async updateByAccountId(accountId: string, payload: any) {
		const allowed = [
			'avatar','dateOfBirth','gender','city',
			'desiredPosition','summaryExperience','skills','cvId','cvFields','cvPdfUrl'
		];
		const update: any = {};
		for (const key of allowed) {
			if (Object.prototype.hasOwnProperty.call(payload, key)) {
				update[key] = payload[key];
			}
		}
		const accountObjectId = new Types.ObjectId(accountId);
		const updated = await this.userModel.findOneAndUpdate(
			{ accountId: accountObjectId },
			{ $set: update },
			{ new: true },
		);
		if (!updated) throw new BadRequestException('User not found');
		return updated;
	}

	async setAvatarByAccountId(accountId: string, url: string) {
		const accountObjectId = new Types.ObjectId(accountId);
		const updated = await this.userModel.findOneAndUpdate(
			{ accountId: accountObjectId },
			{ $set: { avatar: url } },
			{ new: true },
		);
		if (!updated) throw new BadRequestException('User not found');
		return updated;
	}

	async getCvDataByAccountId(accountId: string) {
		const accountObjectId = new Types.ObjectId(accountId);
		const user = await this.userModel
			.findOne({ accountId: accountObjectId })
			.populate('cvId')
			.select('cvId cvFields avatar desiredPosition summaryExperience skills accountId')
			.exec();
		
		if (!user) {
			throw new BadRequestException('User not found');
		}

		const cv: any = user.cvId || null;

		return {
			user: {
				_id: user._id,
				accountId: user.accountId,
				avatar: user.avatar,
				desiredPosition: user.desiredPosition,
				summaryExperience: user.summaryExperience,
				skills: user.skills,
				cvId: user.cvId,
				cvFields: user.cvFields
			},
			cvTemplate: cv ? {
				_id: cv._id,
				name: cv.name,
				title: cv.title,
				html: cv.html,
				css: cv.css
			} : null
		};
	}
}
