import { PartialType } from '@nestjs/mapped-types';
import { CreateTmpDto } from './create-tmp.dto';

export class UpdateTmpDto extends PartialType(CreateTmpDto) {}
