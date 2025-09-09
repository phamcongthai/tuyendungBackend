import { Types } from 'mongoose';
import { Gender, CompanyRole } from '../schemas/recruiter.schema';

export interface IRecruiter {
  _id?: Types.ObjectId;
  accountId: Types.ObjectId;
  companyId: Types.ObjectId;
  position?: string;
  gender: Gender;
  province?: string;
  district?: string;
  avatar?: string;
  companyRole: CompanyRole;
  isActive: boolean;
  deleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateRecruiter {
  companyId: Types.ObjectId;
  position?: string;
  gender: Gender;
  province?: string;
  district?: string;
  avatar?: string;
  companyRole?: CompanyRole;
}

export interface IUpdateRecruiter {
  companyId?: Types.ObjectId;
  position?: string;
  gender?: Gender;
  province?: string;
  district?: string;
  avatar?: string;
  companyRole?: CompanyRole;
  isActive?: boolean;
}
