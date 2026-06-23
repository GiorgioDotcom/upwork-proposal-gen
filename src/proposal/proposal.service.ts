import Anthropic from '@anthropic-ai/sdk';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FREELANCER_PROFILE } from '../config/profile.config';
import { JobPost } from '../jobs/entities/job-post.entity';
import { Proposal, ProposalOutcome } from '../jobs/entities/proposal.entity';
import { UpdateOutcomeDto } from './dto/update-outcome.dto';

interface ExtractedJob {
  keywords: string[];
  requirements: string[];
  summary: string;
}

@Injectable()
export class ProposalService implements OnModuleInit {
  private readonly logger = new Logger(ProposalService.name);
  private anthropic: Anthropic;

  // Cheap/fast model for structured extraction; stronger model for the prose.
  private readonly extractModel: string;
  private readonly writeModel: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(JobPost)
    private readonly jobPosts: Repository<JobPost>,
    @InjectRepository(Proposal)
    private readonly proposals: Repository<Proposal>,
  ) {
    this.extractModel = this.config.get<string>(
      'EXTRACT_MODEL',
      'claude-haiku-4-5-20251001',
    );
    this.writeModel = this.config.get<string>(
      'WRITE_MODEL',
      'claude-sonnet-4-6',
    );
  }

  onModuleInit() {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  async generate(jobText: string): Promise<Proposal> {
    const extracted = await this.extract(jobText);
    const content = await this.write(jobText, extracted);

    const jobPost = await this.jobPosts.save(
      this.jobPosts.create({
        rawText: jobText,
        parsedKeywords: extracted.keywords,
      }),
    );

    return this.proposals.save(
      this.proposals.create({
        jobPostId: jobPost.id,
        content,
        model: this.writeModel,
        outcome: ProposalOutcome.PENDING,
      }),
    );
  }

  async setOutcome(id: string, dto: UpdateOutcomeDto): Promise<Proposal> {
    const proposal = await this.proposals.findOne({ where: { id } });
    if (!proposal) {
      throw new NotFoundException(`Proposal ${id} not found`);
    }
    proposal.outcome = dto.outcome;
    return this.proposals.save(proposal);
  }

  /**
   * Win-rate analytics grouped by extracted keyword.
   * Unnests the jsonb keyword array per job post and aggregates outcomes.
   */
  async winRateByKeyword() {
    return this.proposals.query(
      `SELECT kw AS keyword,
              COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE p.outcome = 'won')::int AS won,
              ROUND(
                COUNT(*) FILTER (WHERE p.outcome = 'won')::numeric
                / NULLIF(COUNT(*) FILTER (WHERE p.outcome IN ('won','lost')), 0),
                2
              ) AS win_rate
       FROM proposals p
       JOIN job_posts j ON j.id = p.job_post_id
       CROSS JOIN LATERAL jsonb_array_elements_text(j."parsedKeywords") AS kw
       GROUP BY kw
       ORDER BY total DESC`,
    );
  }

  private async extract(jobText: string): Promise<ExtractedJob> {
    const message = await this.callAnthropic(this.extractModel, 1024, [
      {
        role: 'user',
        content:
          'Extract structured data from this Upwork job post. Respond with ONLY ' +
          'a JSON object of the shape ' +
          '{"keywords": string[], "requirements": string[], "summary": string}. ' +
          'keywords = tech/skills/domain terms (lowercase, deduped). ' +
          'requirements = concrete things the client wants done. ' +
          'summary = one sentence on what the client needs.\n\n' +
          `JOB POST:\n${jobText}`,
      },
    ]);

    try {
      const json = message.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
      const parsed = JSON.parse(json) as Partial<ExtractedJob>;
      return {
        keywords: parsed.keywords ?? [],
        requirements: parsed.requirements ?? [],
        summary: parsed.summary ?? '',
      };
    } catch {
      this.logger.warn('Extraction did not return valid JSON; continuing empty');
      return { keywords: [], requirements: [], summary: '' };
    }
  }

  private async write(
    jobText: string,
    extracted: ExtractedJob,
  ): Promise<string> {
    const userPrompt =
      `Write an Upwork proposal for this job post.\n\n` +
      `Client needs (extracted): ${extracted.summary}\n` +
      `Key requirements: ${extracted.requirements.join('; ') || 'n/a'}\n\n` +
      `JOB POST:\n${jobText}\n\n` +
      `Rules:\n` +
      `- Open with a specific hook tied to THIS job, not a generic greeting.\n` +
      `- 120-180 words. Short paragraphs.\n` +
      `- Map my relevant strengths to their requirements; reference a highlight only if relevant.\n` +
      `- End with one concrete question or next step.\n` +
      `- Output ONLY the proposal text, ready to paste. No subject line, no notes.`;

    return this.callAnthropic(this.writeModel, 1024, [
      { role: 'user', content: userPrompt },
    ]);
  }

  private get systemPrompt(): string {
    const p = FREELANCER_PROFILE;
    return [
      `You write first-person Upwork proposals on behalf of ${p.name}, a ${p.title} with ${p.yearsExperience}+ years of experience.`,
      `Target rate: $${p.hourlyRateUsd}/hour.`,
      `Stack: ${p.stack.join(', ')}.`,
      `Strengths: ${p.strengths.join('; ')}.`,
      `Real work to draw on:\n- ${p.highlights.join('\n- ')}`,
      `Tone: ${p.tone}`,
      `Rate strategy: ${p.rateStrategy}`,
      `Never invent experience, clients, or numbers not listed above. If the job is a poor fit, still write the best honest proposal.`,
    ].join('\n\n');
  }

  private async callAnthropic(
    model: string,
    maxTokens: number,
    messages: Anthropic.MessageParam[],
  ): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        system: this.systemPrompt,
        messages,
      });
      return response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('')
        .trim();
    } catch (err) {
      this.logger.error(`Anthropic call failed (${model})`, err as Error);
      throw new InternalServerErrorException('LLM request failed');
    }
  }
}
