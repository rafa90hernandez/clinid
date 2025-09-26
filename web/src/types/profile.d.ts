// web/src/types/profile.d.ts

export interface ProfileResponse {
  id: string; // ID do perfil clínico
  userId: string; // ID do usuário associado a este perfil
  createdAt: string; // Data de criação do perfil (como string ISO)
  updatedAt: string; // Última data de atualização (como string ISO)
  consentAt: string; // Data do consentimento (como string ISO)
  firstName: string; // Primeiro nome (não opcional no backend após criação, default é '')
  lastName: string;  // Último nome (não opcional no backend após criação, default é '')
  sex: 'M' | 'F' | null; // Tipos esperados pelo seletor, e null se não definido
  bloodType: string | null; // A API retorna como string, não uma enum restrita
  allergies: string[];
  medications: string[];
  diseases: string[];
  surgeries: string[];
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}