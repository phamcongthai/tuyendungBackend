// roles.repository.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RolesDocument } from '../schemas/roles.schemas';
import { buildNameSearchQuery } from 'src/utils/buildSearchQuery';
import { RolesStatus } from '../enums/roles.enum';
import { CreateRolesDto } from '../dtos/create-role.dto';
import { UpdateRolesDto } from '../dtos/update-role.dto';

@Injectable()
export class RolesRepository {
  constructor(
    @InjectModel(Role.name) private readonly RolesModel: Model<RolesDocument>,
  ) {}

  //[GET]: /admin/roles
  findAll(page: number, limit: number, search: string, status?: string) {
    const query: any = {
      ...buildNameSearchQuery(search),
      deleted: false,
    };
    if (status && (status === RolesStatus.ACTIVE || status === RolesStatus.INACTIVE)) {
      query.status = status;
    } else {
      query.status = RolesStatus.ACTIVE;
    }
    return Promise.all([
      this.RolesModel.find(query).skip((page - 1) * limit).limit(limit).exec(),
      this.RolesModel.countDocuments(query),
    ]).then(([data, total]) => ({ data, total }));
  }

  //[GET]: /admin/roles/:id
  findOne(id: string) {
    return this.RolesModel.findById(id).exec();
  }

  //[POST]: /admin/roles/create
  async create(createDto: CreateRolesDto) {
    return this.RolesModel.create(createDto);
  }

  //[PATCH]: /admin/roles/:id
  updateById(id: string, updateDto: UpdateRolesDto) {
    return this.RolesModel.findByIdAndUpdate(id, updateDto, {
      new: true,
      runValidators: true,
    }).exec();
  }

  //[CUSTOM]: Tìm role theo tên
  async findByName(name: string) {
    return this.RolesModel.findOne({
      name: name,
      deleted: false,
      status: RolesStatus.ACTIVE,
    }).exec();
  }
}
