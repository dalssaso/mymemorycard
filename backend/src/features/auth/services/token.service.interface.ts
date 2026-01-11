export interface JWTPayload {
  userId: string;
  username: string;
}

export interface ITokenService {
  generateToken(payload: JWTPayload): string;
  verifyToken(token: string): JWTPayload | null;
}
