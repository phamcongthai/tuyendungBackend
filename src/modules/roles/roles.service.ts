import { Injectable } from '@nestjs/common';
import { RolesRepository } from './repositories/roles.repository'; 
import { CreateRolesDto } from './dtos/create-role.dto';
import { UpdateRolesDto } from './dtos/update-role.dto';
@Injectable()
export class RolesService {
  constructor(private readonly RolesRepo: RolesRepository) {}
  
  
    async findAll(page: number, limit: number, search: string, status?: string) {
      return await this.RolesRepo.findAll(page, limit, search, status);
    }
  
    async findOne(id: string) {
      return await this.RolesRepo.findOne(id);
    }

    async create(createRolesDto: CreateRolesDto) {
      return await this.RolesRepo.create(createRolesDto);
    }

    async update(id: string, updateRolesDto: UpdateRolesDto) {
      return await this.RolesRepo.updateById(id, updateRolesDto);
    }
  
  
}

