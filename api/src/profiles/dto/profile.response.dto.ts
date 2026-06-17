import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponse {
  @ApiProperty({ example: 'M', description: 'Patient sex. (M/F)' })
  sex?: string | null;

  @ApiProperty({ example: 'O+', description: 'Patient blood type.' })
  bloodType?: string | null;

  @ApiProperty({ type: [String], example: ['Dipyrone'], description: 'Patient allergies.' })
  allergies?: string[] | null;

  @ApiProperty({ type: [String], example: ['Insulin'], description: 'Current medications.' })
  medications?: string[] | null;

  @ApiProperty({ type: [String], example: ['Diabetes'], description: 'Medical conditions.' })
  diseases?: string[] | null;

  @ApiProperty({ type: [String], example: ['Appendix surgery'], description: 'Previous surgeries.' })
  surgeries?: string[] | null;

  @ApiProperty({ example: 'Maria Silva', description: 'Emergency contact name.' })
  emergencyContactName?: string | null;

  @ApiProperty({ example: '+353 83 000 0000', description: 'Emergency contact phone number.' })
  emergencyContactPhone?: string | null;
}
