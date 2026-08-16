import { AuthSessionUser } from '@skillmatrix/shared';

export interface AppEnv {
  Variables: {
    user: AuthSessionUser;
    requestId: string;
    session: any;
  };
}
