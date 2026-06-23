import { IsEnum } from 'class-validator';
import { ProposalOutcome } from '../../jobs/entities/proposal.entity';

export class UpdateOutcomeDto {
  @IsEnum(ProposalOutcome, {
    message: `outcome must be one of: ${Object.values(ProposalOutcome).join(', ')}`,
  })
  outcome: ProposalOutcome;
}
