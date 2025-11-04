import { Injectable, BadRequestException } from '@nestjs/common';
import { JobsService } from '../jobs/jobs.service';
import { ApplicationsRepository } from '../applications/repositories/applications.repository';
import axios from 'axios';

type CVStruct = {
  desiredPosition: string;
  experienceYears: number;
  level: string; // e.g., fresher, junior, mid, senior
  objective: string;
};

type JDStruct = {
  title: string;
  requirements: string;
};

@Injectable()
export class AiService {
  constructor(
    private readonly jobsService: JobsService,
    private readonly applicationsRepo: ApplicationsRepository,
  ) {}

  // Heuristic scoring: 0..100
  computeMatchScore(cv: CVStruct, jd: JDStruct) {
    const textA = `${cv.desiredPosition || ''} ${cv.objective || ''}`.toLowerCase();
    const textB = `${jd.title || ''} ${jd.requirements || ''}`.toLowerCase();

    const tokenize = (t: string) =>
      t
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);

    const tokensA = new Set(tokenize(textA));
    const tokensB = new Set(tokenize(textB));
    let intersect = 0;
    tokensA.forEach((w) => {
      if (tokensB.has(w)) intersect += 1;
    });
    const union = new Set<string>([...tokensA, ...tokensB]).size || 1;
    const textScore = intersect / union; // 0..1

    // Experience detection from JD (first integer found treated as years)
    const expMatch = jd.requirements?.match(/(\d+)(?=\s*(\+)?\s*(year|yr|years|năm))/i) || jd.requirements?.match(/\b(\d{1,2})\b/);
    const expJd = expMatch ? Number(expMatch[1]) : 0;
    const expCv = Number(cv.experienceYears || 0);
    const expDiff = Math.abs(expCv - expJd);
    const expScore = Math.max(0, 1 - expDiff / 5); // within 5y diff -> decent score

    const normalizeLevel = (s: string) =>
      (s || '').toLowerCase().trim();
    const levelCv = normalizeLevel(cv.level);
    let levelJd = '';
    const jdl = `${jd.title} ${jd.requirements}`.toLowerCase();
    if (/intern|thực tập/.test(jdl)) levelJd = 'intern';
    else if (/fresher|mới ra trường|entry/.test(jdl)) levelJd = 'fresher';
    else if (/junior/.test(jdl)) levelJd = 'junior';
    else if (/(mid|middle|mid-level)/.test(jdl)) levelJd = 'mid';
    else if (/senior|sr\b/.test(jdl)) levelJd = 'senior';

    const levelOrder = ['intern', 'fresher', 'junior', 'mid', 'senior'];
    const idxCv = levelOrder.indexOf(levelCv);
    const idxJd = levelOrder.indexOf(levelJd);
    const dist = idxCv >= 0 && idxJd >= 0 ? Math.abs(idxCv - idxJd) : -1;
    const levelScore = levelCv && levelJd ? Math.max(0, 1 - (dist < 0 ? 3 : dist) / 3) : 0.5;

    // Weights -> 0..100
    const total0to1 = 0.6 * textScore + 0.3 * expScore + 0.1 * levelScore;
    const score = Math.round(total0to1 * 100);

    return {
      score,
      debug_info: {
        text_score_0_1: Number(textScore.toFixed(3)),
        exp_score_0_1: Number(expScore.toFixed(3)),
        exp_cv_detected: expCv,
        level_cv_detected: levelCv || null,
        exp_jd_detected: expJd,
        level_jd_detected: levelJd || null,
      },
    };
  }

  async processCvFromPdfUrl(pdfUrl: string): Promise<CVStruct | null> {
    if (!pdfUrl) return null;
    try {
      const res = await axios.post('http://localhost:7000/process-cv/', { pdf_url: pdfUrl }, { timeout: 60_000 });
      const data = res?.data || {};
      return {
        desiredPosition: data.desiredPosition || '',
        experienceYears: Number(data.experienceYears || 0),
        level: data.level || '',
        objective: data.objective || '',
      };
    } catch (e) {
      return null;
    }
  }

  async rankApplicantsForJob(jobId: string) {
    if (!jobId) throw new BadRequestException('jobId is required');
    const job = await this.jobsService.detail(jobId);
    if (!job) throw new BadRequestException('Job not found');

    const jd: JDStruct = {
      title: (job as any).title || '',
      requirements: (job as any).requirements || '',
    };

    try {
      // eslint-disable-next-line no-console
      console.log('[AI] rank-applicants JD =>', jd);
    } catch {}

    const { data: applications } = await this.applicationsRepo.findAllByJob(jobId, 1, 1000);

    const results = [] as Array<{
      applicationId: string;
      account: { fullName?: string; email?: string; phone?: string } | null;
      cvPdfUrl?: string | null;
      structured_cv: CVStruct | null;
      score: number;
      debug_info: any;
    }>;

    for (const app of applications as any[]) {
      const cvPdfUrl: string | null = app?.userProfile?.cvPdfUrl || null;
      const structured = await this.processCvFromPdfUrl(cvPdfUrl || '');
      try {
        // Log data just before analysis
        // eslint-disable-next-line no-console
        console.log('[AI] analyzing application =>', {
          applicationId: String(app._id),
          account: app?.account || null,
          cvPdfUrl,
          structured_cv: structured,
          jd,
        });
      } catch {}
      if (!structured) {
        results.push({
          applicationId: String(app._id),
          account: app?.account || null,
          cvPdfUrl,
          structured_cv: null,
          score: 0,
          debug_info: { error: 'CV processing failed or no cvPdfUrl' },
        });
        continue;
      }
      const { score, debug_info } = this.computeMatchScore(structured, jd);
      results.push({
        applicationId: String(app._id),
        account: app?.account || null,
        cvPdfUrl,
        structured_cv: structured,
        score,
        debug_info,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return {
      job: { _id: String((job as any)._id), title: jd.title },
      total: results.length,
      results,
    };
  }
}


