import { ApiProperty } from '@nestjs/swagger';

export class SettingsDto {
  @ApiProperty({ example: 7, description: 'Days between sending an application and following up' })
  followUpDelayDays: number;
}
