import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class GenerateProposalDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(30, { message: 'jobText looks too short to be a real job post' })
  jobText: string;
}
