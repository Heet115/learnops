export type UserRole = "admin" | "hod" | "professor" | "student";

export interface UserMetadata {
  role?: UserRole;
}

// View Transitions API types
interface ViewTransition {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition(): void;
}

declare global {
  interface CustomJwtSessionClaims {
    metadata: UserMetadata;
  }

  interface Document {
    startViewTransition?(callback: () => void | Promise<void>): ViewTransition;
  }
}

export {};
