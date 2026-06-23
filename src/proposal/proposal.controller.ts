import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { GenerateProposalDto } from './dto/generate-proposal.dto';
import { UpdateOutcomeDto } from './dto/update-outcome.dto';
import { ProposalService } from './proposal.service';

@Controller()
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Post('proposal')
  async generate(@Body() dto: GenerateProposalDto) {
    const proposal = await this.proposalService.generate(dto.jobText);
    return {
      id: proposal.id,
      content: proposal.content,
      model: proposal.model,
      outcome: proposal.outcome,
    };
  }

  @Patch('proposals/:id')
  setOutcome(@Param('id') id: string, @Body() dto: UpdateOutcomeDto) {
    return this.proposalService.setOutcome(id, dto);
  }

  @Get('analytics/win-rate')
  winRate() {
    return this.proposalService.winRateByKeyword();
  }
}
