import { ApiProperty } from '@nestjs/swagger';

// Mantemos o tipo BloodTypeLiterals para referência, mas o DTO aceitará string para flexibilidade.
type BloodTypeLiterals = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export class ProfileResponse {
  @ApiProperty({ example: 'João', description: 'Primeiro nome do usuário.' })
  firstName?: string | null;

  @ApiProperty({ example: 'Silva', description: 'Sobrenome do usuário.' })
  lastName?: string | null;

  // CORRIGIDO: Agora aceita string | null, conforme o Prisma retorna
  @ApiProperty({ example: 'M', description: 'Sexo do usuário. (M/F)' })
  sex?: string | null; // <-- Alterado de 'M' | 'F' | null

  // CORRIGIDO: Agora aceita string | null, conforme o Prisma retorna
  @ApiProperty({ example: 'O+', description: 'Tipo sanguíneo do usuário.' })
  bloodType?: string | null; // <-- Alterado de BloodTypeLiterals | null

  @ApiProperty({ type: [String], example: ['Dipirona', 'Aspirina'], description: 'Lista de alergias do usuário.' })
  allergies?: string[] | null;

  @ApiProperty({ type: [String], example: ['Insulina'], description: 'Lista de medicamentos em uso pelo usuário.' })
  medications?: string[] | null;

  @ApiProperty({ type: [String], example: ['Diabetes'], description: 'Lista de doenças pré-existentes do usuário.' })
  diseases?: string[] | null;

  @ApiProperty({ type: [String], example: ['Apêndice'], description: 'Lista de cirurgias realizadas pelo usuário.' })
  surgeries?: string[] | null;

  @ApiProperty({ example: 'Maria Silva', description: 'Nome do contato de emergência.' })
  emergencyContactName?: string | null;

  @ApiProperty({ example: '(11) 99999-9999', description: 'Telefone do contato de emergência.' })
  emergencyContactPhone?: string | null;
}
