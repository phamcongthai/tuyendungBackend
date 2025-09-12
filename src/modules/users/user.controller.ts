import {
	Controller,
	Post,
	Body,
	Get,
	Patch,
	Delete,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	Req,
	Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { multerConfig } from '../../utils/multer.config';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UserController {
	constructor(private readonly usersService: UsersService) {}

	@Post('init')
	@ApiOperation({ summary: 'Khởi tạo hồ sơ user trống theo accountId' })
	@ApiBody({ schema: { properties: { accountId: { type: 'string', example: '65f1c0d2a1b2c3d4e5f6a7b8' }, fullName: { type: 'string', example: 'Nguyễn Văn A' } } } })
	@ApiResponse({ status: 201, description: 'Đã tạo hồ sơ user' })
	async initBlankUser(@Body() body: { accountId: string; fullName?: string }) {
		return this.usersService.initBlankUser(body.accountId, body.fullName);
	}

	@Get('me')
	@ApiOperation({ summary: 'Lấy hồ sơ user hiện tại' })
	getMe(@Req() req: any) {
		const accountId = req.user?.id as string;
		return this.usersService.getMe(accountId);
	}

	@Get('by-account/:accountId')
	@ApiOperation({ summary: 'Lấy hồ sơ user theo accountId (public endpoint)' })
	@ApiResponse({ status: 200, description: 'Lấy hồ sơ user thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy user' })
	@UseGuards() // Bỏ JWT guard cho endpoint này
	getByAccountId(@Param('accountId') accountId: string) {
		return this.usersService.getMe(accountId);
	}

	@Get('by-account/:accountId/cv-data')
	@ApiOperation({ summary: 'Lấy dữ liệu CV của user theo accountId (cho recruiter)' })
	@ApiResponse({ status: 200, description: 'Lấy dữ liệu CV thành công' })
	@ApiResponse({ status: 404, description: 'Không tìm thấy user hoặc CV' })
	@UseGuards() // Bỏ JWT guard cho endpoint này
	getCvDataByAccountId(@Param('accountId') accountId: string) {
		return this.usersService.getCvDataByAccountId(accountId);
	}

	@Patch('me')
	@ApiOperation({ summary: 'Cập nhật hồ sơ user hiện tại' })
	updateMe(@Req() req: any, @Body() body: UpdateUserDto) {
		const accountId = req.user?.id as string;
		return this.usersService.updateMe(accountId, body);
	}

	@Post('me/avatar')
	@UseInterceptors(FileInterceptor('file', multerConfig))
	@ApiConsumes('multipart/form-data')
	@ApiOperation({ summary: 'Upload avatar cho user hiện tại' })
	uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
		const accountId = req.user?.id as string;
		return this.usersService.uploadAvatar(accountId, file);
	}

	@Delete('me/cv')
	@ApiOperation({ summary: 'Xóa CV của user hiện tại' })
	@ApiResponse({ status: 200, description: 'Đã xóa CV thành công' })
	deleteCv(@Req() req: any) {
		const accountId = req.user?.id as string;
		return this.usersService.deleteCv(accountId);
	}
}
