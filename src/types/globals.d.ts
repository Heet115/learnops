export type UserRole = "admin" | "hod" | "professor" | "student";

export interface UserMetadata {
  role?: UserRole;
}

// Standardized server action result type
export type ActionResult<T = undefined> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string; errorCode?: string };

// Common error codes for server actions
export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "DUPLICATE"
  | "FORBIDDEN"
  | "DEADLINE_PASSED"
  | "LOCKED"
  | "SERVER_ERROR";

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
