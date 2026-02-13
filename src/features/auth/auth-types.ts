export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const MIN_AGE = 13;
export const MIN_PASSWORD_LENGTH = 8;
