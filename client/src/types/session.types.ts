export interface AuthSession {
  sessionId: string;
  userId: string;
  createdAt: string | null;
  isCurrent: boolean;
}
