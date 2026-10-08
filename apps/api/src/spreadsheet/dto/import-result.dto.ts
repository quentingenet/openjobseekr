import { ApiProperty } from '@nestjs/swagger';
import type { IgnoredSkill } from '../domain/select-new-skills.js';

class IgnoredSkillDto implements IgnoredSkill {
  @ApiProperty({ example: 6, description: 'Row in the "Compétences" sheet' })
  row: number;

  @ApiProperty({ example: 'TYPESCRIPT' })
  name: string;

  @ApiProperty({ example: 'TypeScript', description: 'The skill kept under this name' })
  keptName: string;
}

export class ImportResultDto {
  @ApiProperty({ example: 12, description: 'Applications deleted and replaced by the file' })
  deletedApplications: number;

  @ApiProperty({ example: 42 })
  importedApplications: number;

  @ApiProperty({ example: 3, description: 'Skills added; existing skills are kept' })
  addedSkills: number;

  @ApiProperty({
    type: [IgnoredSkillDto],
    description: 'Skills of the file already present, under the same name or an earlier row',
  })
  ignoredSkills: IgnoredSkillDto[];

  @ApiProperty({
    example: 2,
    description:
      'Follow-up dates picked in the app and kept: same sent date, company and job title, and no date typed by hand in the file',
  })
  keptFollowUpDates: number;
}
