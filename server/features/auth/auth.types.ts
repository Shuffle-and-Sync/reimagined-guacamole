export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface PasswordResetToken {
  email: string;
  token: string;
  expiresAt: Date;
}

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  communities?: any[];
}