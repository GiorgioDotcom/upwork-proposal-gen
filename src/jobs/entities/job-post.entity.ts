import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Proposal } from './proposal.entity';

@Entity('job_posts')
export class JobPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  rawText: string;

  /** Keywords/requirements extracted from the post by the LLM. */
  @Column('jsonb', { default: () => "'[]'" })
  parsedKeywords: string[];

  @OneToMany(() => Proposal, (proposal) => proposal.jobPost)
  proposals: Proposal[];

  @CreateDateColumn()
  createdAt: Date;
}
