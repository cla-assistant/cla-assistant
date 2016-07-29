import { AuthGuard } from './auth.guard.ts';
import { AuthService } from './auth.service.ts';

export * from './login.component.ts';
export const LOGIN_PROVIDERS = [
  AuthGuard,
  AuthService
];
