export type UserRole = 'admin' | 'hod' | 'professor' | 'student';

export interface UserMetadata {
  role?: UserRole;
}

declare global {
  interface CustomJwtSessionClaims {
    metadata: UserMetadata;
  }
}

export {};
