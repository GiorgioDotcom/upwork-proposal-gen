import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobPost } from '../jobs/entities/job-post.entity';
import { Proposal } from '../jobs/entities/proposal.entity';
import { ProposalController } from './proposal.controller';
import { ProposalService } from './proposal.service';

@Module({
  imports: [TypeOrmModule.forFeature([JobPost, Proposal])],
  controllers: [ProposalController],
  providers: [ProposalService],
})
export class ProposalModule {}
