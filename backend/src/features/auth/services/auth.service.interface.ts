import type { User } from "../types";

export interface AuthResult {
  user: {
    id: string;
    username: string;
    email: string;
  };
  token: string;
}

export interface IAuthService {
  register(username: string, email: string, password: string): Promise<AuthResult>;
  login(username: string, password: string): Promise<AuthResult>;
  validateToken(token: string): Promise<User | null>;
}
