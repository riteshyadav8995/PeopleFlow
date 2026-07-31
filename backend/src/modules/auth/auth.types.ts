export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
    organizationId?: string;
    roles: string[];
    permissions: string[];
    hasEmployeeProfile?: boolean;
    employeeId?: string;
  };
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
  };
  tokens: AuthTokens;
}
