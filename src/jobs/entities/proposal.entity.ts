import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { JobPost } from './job-post.entity';

export enum ProposalOutcome {
  PENDING = 'pending',
  WON = 'won',
  LOST = 'lost',
}

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JobPost, (jobPost) => jobPost.proposals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'job_post_id' })
  jobPost: JobPost;

  @Column({ name: 'job_post_id' })
  jobPostId: string;

  @Column('text')
  content: string;

  /** Anthropic model that generated the proposal text. */
  @Column()
  model: string;

  @Column({
    type: 'enum',
    enum: ProposalOutcome,
    default: ProposalOutcome.PENDING,
  })
  outcome: ProposalOutcome;

  @CreateDateColumn()
  createdAt: Date;
}
