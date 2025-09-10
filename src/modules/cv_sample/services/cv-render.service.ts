import { Injectable } from '@nestjs/common';
import { CvSampleService } from '../cv-sample.service';
import { User, UserDocument } from '../../users/schema/user.schema';
import { CvSample, CvSampleDocument } from '../schemas/cv-sample.schema';

@Injectable()
export class CvRenderService {
  constructor(private readonly cvSampleService: CvSampleService) {}

  async renderUserCv(user: UserDocument) {
    if (!user.cvId) {
      throw new Error('User has no CV template selected');
    }

    // Get CV template
    const cvTemplate = await this.cvSampleService.findById(user.cvId.toString());
    if (!cvTemplate) {
      throw new Error('CV template not found');
    }

    // Merge template with user data
    const renderedHtml = this.mergeTemplateWithUserData(
      cvTemplate.html,
      user.cvFields || {}
    );

    return {
      html: renderedHtml,
      css: cvTemplate.css,
      template: {
        id: (cvTemplate as CvSampleDocument).id,
        name: cvTemplate.name,
        title: cvTemplate.title,
      },
      user: {
        id: user.id,
        accountId: user.accountId,
      },
    };
  }

  private mergeTemplateWithUserData(templateHtml: string, userData: any): string {
    let html = templateHtml;

    // Replace personal info placeholders
    if (userData.personalInfo) {
      const personalInfo = userData.personalInfo;
      html = html.replace(/\{\{fullName\}\}/g, personalInfo.fullName || '');
      html = html.replace(/\{\{email\}\}/g, personalInfo.email || '');
      html = html.replace(/\{\{phone\}\}/g, personalInfo.phone || '');
      html = html.replace(/\{\{address\}\}/g, personalInfo.address || '');
      html = html.replace(/\{\{dateOfBirth\}\}/g, personalInfo.dateOfBirth || '');
      html = html.replace(/\{\{website\}\}/g, personalInfo.website || '');
    }

    // Replace summary
    if (userData.summary) {
      html = html.replace(/\{\{summary\}\}/g, userData.summary);
    }

    // Replace experience
    if (userData.experience && Array.isArray(userData.experience)) {
      const experienceHtml = userData.experience
        .map((exp: any) => `
          <div class="experience-item">
            <h4>${exp.position} - ${exp.company}</h4>
            <p class="date">${exp.startDate} - ${exp.endDate}</p>
            <p>${exp.description}</p>
          </div>
        `)
        .join('');
      html = html.replace(/\{\{experience\}\}/g, experienceHtml);
    }

    // Replace education
    if (userData.education && Array.isArray(userData.education)) {
      const educationHtml = userData.education
        .map((edu: any) => `
          <div class="education-item">
            <h4>${edu.degree} - ${edu.school}</h4>
            <p class="date">${edu.startDate} - ${edu.endDate}</p>
            ${edu.gpa ? `<p>GPA: ${edu.gpa}</p>` : ''}
          </div>
        `)
        .join('');
      html = html.replace(/\{\{education\}\}/g, educationHtml);
    }

    // Replace skills
    if (userData.skills && Array.isArray(userData.skills)) {
      const skillsHtml = userData.skills
        .map((skill: string) => `<span class="skill-tag">${skill}</span>`)
        .join('');
      html = html.replace(/\{\{skills\}\}/g, skillsHtml);
    }

    // Replace certifications
    if (userData.certifications && Array.isArray(userData.certifications)) {
      const certificationsHtml = userData.certifications
        .map((cert: any) => `
          <div class="certification-item">
            <h4>${cert.name}</h4>
            <p class="year">${cert.year}</p>
          </div>
        `)
        .join('');
      html = html.replace(/\{\{certifications\}\}/g, certificationsHtml);
    }

    return html;
  }
}
