// Definição do tipo ProfileResponse para uso no frontend
export type ProfileResponse = {
  firstName?: string | null;
  lastName?: string | null;
  sex?: string | null; // Aceita string|null conforme ajustamos no backend
  bloodType?: string | null; // Aceita string|null conforme ajustamos no backend
  allergies?: string[] | null;
  medications?: string[] | null;
  diseases?: string[] | null;
  surgeries?: string[] | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
};