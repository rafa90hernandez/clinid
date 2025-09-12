import { IsString, Length, Matches } from 'class-validator';

export class PublicViewDto {
  @IsString()
  slug!: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/)
  pin!: string;
}
