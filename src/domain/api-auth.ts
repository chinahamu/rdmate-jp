import { z } from 'zod';

export const apiAuthModeValues = ['none', 'passcode', 'phase4', 'api_token'] as const;
export type ApiAuthMode = (typeof apiAuthModeValues)[number];

export const apiTokenScopeValues = ['project:read', 'project:write', 'dmp:read', 'dataset:read', 'export:read', 'validator:run'] as const;
export type ApiTokenScope = (typeof apiTokenScopeValues)[number];

export const apiAccessPolicySchema = z.object({
  mode: z.enum(apiAuthModeValues).default('none'),
  passcodeHashRef: z.string().min(1).optional(),
  phase4Provider: z.string().min(1).optional(),
  allowLocalNoAuth: z.boolean().default(true),
});

export const projectApiTokenSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  tokenPrefix: z.string().min(4),
  tokenHashRef: z.string().min(1),
  scopes: z.array(z.enum(apiTokenScopeValues)).min(1),
  expiresAt: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
});

export const apiAuthCheckResultSchema = z.object({
  ok: z.boolean(),
  mode: z.enum(apiAuthModeValues),
  projectId: z.string().min(1).optional(),
  scopes: z.array(z.enum(apiTokenScopeValues)).default([]),
  reason: z.string().min(1).optional(),
});

export type ApiAccessPolicyInput = z.input<typeof apiAccessPolicySchema>;
export type ApiAccessPolicy = z.infer<typeof apiAccessPolicySchema>;
export type ProjectApiTokenInput = z.input<typeof projectApiTokenSchema>;
export type ProjectApiToken = z.infer<typeof projectApiTokenSchema>;
export type ApiAuthCheckResult = z.infer<typeof apiAuthCheckResultSchema>;

export function createApiAccessPolicy(input: ApiAccessPolicyInput): ApiAccessPolicy {
  return apiAccessPolicySchema.parse(input);
}

export function createProjectApiToken(input: ProjectApiTokenInput): ProjectApiToken {
  return projectApiTokenSchema.parse(input);
}

export function getDefaultLocalApiAccessPolicy(): ApiAccessPolicy {
  return createApiAccessPolicy({
    mode: 'none',
    allowLocalNoAuth: true,
  });
}

export function getPasscodeApiAccessPolicy(passcodeHashRef: string): ApiAccessPolicy {
  return createApiAccessPolicy({
    mode: 'passcode',
    passcodeHashRef,
    allowLocalNoAuth: false,
  });
}

export function getPhase4ServerApiAccessPolicy(provider = 'phase4-auth-provider'): ApiAccessPolicy {
  return createApiAccessPolicy({
    mode: 'phase4',
    phase4Provider: provider,
    allowLocalNoAuth: false,
  });
}

export function verifyApiAccess(input: {
  policy: ApiAccessPolicy;
  token?: ProjectApiToken;
  requiredScope?: ApiTokenScope;
  projectId?: string;
}): ApiAuthCheckResult {
  const { policy, token, requiredScope, projectId } = input;

  if (policy.mode === 'none' && policy.allowLocalNoAuth) {
    return apiAuthCheckResultSchema.parse({ ok: true, mode: 'none', projectId, scopes: [] });
  }

  if (policy.mode === 'passcode') {
    return apiAuthCheckResultSchema.parse({
      ok: true,
      mode: 'passcode',
      projectId,
      scopes: [],
      reason: 'Passcode verification is represented by passcodeHashRef and handled at the app boundary.',
    });
  }

  if (policy.mode === 'phase4') {
    return apiAuthCheckResultSchema.parse({
      ok: false,
      mode: 'phase4',
      projectId,
      reason: 'Phase 4 authentication provider is required for shared server deployment.',
    });
  }

  if (!token) {
    return apiAuthCheckResultSchema.parse({ ok: false, mode: 'api_token', projectId, reason: 'API token is required.' });
  }

  if (projectId && token.projectId !== projectId) {
    return apiAuthCheckResultSchema.parse({ ok: false, mode: 'api_token', projectId, reason: 'Token project scope does not match.' });
  }

  if (requiredScope && !token.scopes.includes(requiredScope)) {
    return apiAuthCheckResultSchema.parse({ ok: false, mode: 'api_token', projectId, scopes: token.scopes, reason: 'Required scope is missing.' });
  }

  return apiAuthCheckResultSchema.parse({ ok: true, mode: 'api_token', projectId: token.projectId, scopes: token.scopes });
}

export function createSampleProjectApiToken(projectId = 'sample-project'): ProjectApiToken {
  return createProjectApiToken({
    id: `token-${projectId}`,
    projectId,
    tokenPrefix: 'rdm_',
    tokenHashRef: `secret-manager://rdmate/${projectId}/api-token-hash`,
    scopes: ['project:read', 'dmp:read', 'dataset:read', 'export:read', 'validator:run'],
    createdAt: '2026-06-29T00:00:00.000Z',
  });
}
