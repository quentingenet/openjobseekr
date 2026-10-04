import { ApiProperty } from '@nestjs/swagger';

export class SkillDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'TypeScript' })
  name: string;

  @ApiProperty({ example: '\\bTypeScript\\b' })
  pattern: string;

  @ApiProperty({ type: Number, nullable: true, minimum: 0, maximum: 5 })
  level: number | null;
}

export class SkillStatDto extends SkillDto {
  @ApiProperty({ description: 'Number of job postings whose text matches the pattern' })
  postingCount: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'postingCount / postingsAnalyzed; null when no posting text was saved',
  })
  frequency: number | null;
}

export class SkillStatsDto {
  @ApiProperty({ description: 'Applications with a job posting text' })
  postingsAnalyzed: number;

  @ApiProperty({ type: [SkillStatDto], description: 'Most frequent first, then by name' })
  skills: SkillStatDto[];
}
