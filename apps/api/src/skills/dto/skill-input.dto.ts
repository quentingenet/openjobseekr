import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { SKILL_LIMITS } from '@openjobseekr/domain';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateBy,
} from 'class-validator';
import { IsOptionalNotNull } from '../../common/decorators/validation.decorators.js';
import { Trim } from '../../common/transforms.js';
import { checkSkillPattern } from '../domain/skill-pattern.js';

/** Valid RE2 regular expression (`isRegex`), the syntax of Google Sheets' REGEXMATCH. */
const IsRegex = (): PropertyDecorator =>
  ValidateBy({
    name: 'isRegex',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && checkSkillPattern(value) === 'VALID',
      defaultMessage: () => '$property must be a valid regular expression',
    },
  });

export class CreateSkillDto {
  @ApiProperty({ example: 'TypeScript', maxLength: SKILL_LIMITS.name })
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(SKILL_LIMITS.name)
  name: string;

  @ApiProperty({
    example: '\\bTypeScript\\b',
    maxLength: SKILL_LIMITS.pattern,
    description: 'Regular expression matched case-insensitively against job posting texts',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(SKILL_LIMITS.pattern)
  @IsRegex()
  pattern: string;

  @ApiPropertyOptional({ type: Number, nullable: true, minimum: 0, maximum: 5 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  level?: number | null;
}

/** Partial update: `level` may be cleared with null, `name` and `pattern` may not. */
export class UpdateSkillDto extends PartialType(OmitType(CreateSkillDto, ['name', 'pattern'])) {
  @ApiPropertyOptional({ maxLength: SKILL_LIMITS.name })
  @Trim()
  @IsOptionalNotNull()
  @IsString()
  @IsNotEmpty()
  @MaxLength(SKILL_LIMITS.name)
  name?: string;

  @ApiPropertyOptional({ maxLength: SKILL_LIMITS.pattern })
  @IsOptionalNotNull()
  @IsString()
  @IsNotEmpty()
  @MaxLength(SKILL_LIMITS.pattern)
  @IsRegex()
  pattern?: string;
}
