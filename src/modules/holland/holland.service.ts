import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { HollandQuestionRepository } from './repositories/holland-question.repository';
import { HollandProfileRepository } from './repositories/holland-profile.repository';
import { HollandResultRepository } from './repositories/holland-result.repository';
import { CreateQuestionDto, UpdateQuestionDto } from './dto/create-question.dto';
import { CreateProfileDto, UpdateProfileDto } from './dto/create-profile.dto';
import { SubmitTestDto } from './dto/submit-test.dto';
import { UsersRepository } from '../users/repositories/users.repository';

@Injectable()
export class HollandService {
  constructor(
    private readonly questionRepo: HollandQuestionRepository,
    private readonly profileRepo: HollandProfileRepository,
    private readonly resultRepo: HollandResultRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  // ============ QUESTIONS ============
  async getAllQuestions() {
    const questions = await this.questionRepo.findAll();
    const counts = await this.questionRepo.countByCategory();
    return { questions, counts };
  }

  async getQuestionById(id: string) {
    const question = await this.questionRepo.findById(id);
    if (!question) throw new NotFoundException('Không tìm thấy câu hỏi');
    return question;
  }

  async createQuestion(dto: CreateQuestionDto) {
    return this.questionRepo.create(dto);
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto) {
    const updated = await this.questionRepo.update(id, dto);
    if (!updated) throw new NotFoundException('Không tìm thấy câu hỏi');
    return updated;
  }

  async deleteQuestion(id: string) {
    const deleted = await this.questionRepo.delete(id);
    if (!deleted) throw new NotFoundException('Không tìm thấy câu hỏi');
    return { success: true, message: 'Đã xóa câu hỏi' };
  }

  // ============ PROFILES ============
  async getAllProfiles() {
    return this.profileRepo.findAll();
  }

  async getProfileById(id: string) {
    const profile = await this.profileRepo.findById(id);
    if (!profile) throw new NotFoundException('Không tìm thấy profile');
    return profile;
  }

  async createProfile(dto: CreateProfileDto) {
    // Check duplicate code
    const existing = await this.profileRepo.findByCode(dto.code);
    if (existing) throw new BadRequestException(`Profile với code "${dto.code}" đã tồn tại`);
    return this.profileRepo.create(dto);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const updated = await this.profileRepo.update(id, dto);
    if (!updated) throw new NotFoundException('Không tìm thấy profile');
    return updated;
  }

  async deleteProfile(id: string) {
    const deleted = await this.profileRepo.delete(id);
    if (!deleted) throw new NotFoundException('Không tìm thấy profile');
    return { success: true, message: 'Đã xóa profile' };
  }

  // ============ RESULTS ============
  async getAllResults(page = 1, limit = 20) {
    return this.resultRepo.findAll(page, limit);
  }

  async getResultByAccountId(accountId: string) {
    return this.resultRepo.findByAccountId(accountId);
  }

  // ============ SUBMIT TEST ============
  async submitTest(accountId: string, dto: SubmitTestDto) {
    const { answers } = dto;

    // Lấy tất cả câu hỏi
    const questions = await this.questionRepo.findAll();
    if (questions.length === 0) {
      throw new BadRequestException('Chưa có câu hỏi nào trong hệ thống');
    }

    // Tính điểm cho từng category
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    
    questions.forEach(q => {
      const questionId = String(q._id);
      const selectedValue = answers[questionId];
      
      if (selectedValue !== undefined && selectedValue !== null) {
        const category = q.category as 'R' | 'I' | 'A' | 'S' | 'E' | 'C';
        scores[category] += selectedValue;
      }
    });

    // Sắp xếp để lấy top 3
    const sorted = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    const topCode = sorted.map(([key]) => key).join('-');

    // Tìm profile tương ứng
    let profile = await this.profileRepo.findByCode(topCode);
    
    // Nếu không tìm thấy exact match, thử tìm với 2 chữ cái đầu
    if (!profile && topCode.length >= 3) {
      const twoLetterCode = topCode.split('-').slice(0, 2).join('-');
      profile = await this.profileRepo.findByCode(twoLetterCode);
    }

    // Lưu kết quả
    const result = await this.resultRepo.create(accountId, scores, topCode, answers);

    // Cập nhật vào user profile
    try {
      await this.usersRepo.updateHollandScore(accountId, scores, topCode);
    } catch (error) {
      console.error('Failed to update user holland score:', error);
    }

    return {
      scores,
      topCode,
      profile: profile ? {
        code: profile.code,
        title: profile.title,
        description: profile.description,
        suitableCareers: profile.suitableCareers,
        suggestedSkills: profile.suggestedSkills,
        image: profile.image
      } : null,
      resultId: result._id
    };
  }
}
