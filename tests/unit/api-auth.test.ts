import { describe, expect, it } from 'vitest';
import {
  createSampleProjectApiToken,
  getDefaultLocalApiAccessPolicy,
  getPasscodeApiAccessPolicy,
  getPhase4ServerApiAccessPolicy,
  verifyApiAccess,
} from '../../src/domain/api-auth';

describe('API authentication policy', () => {
  it('allows local no-auth mode for local use', () => {
    const result = verifyApiAccess({
      policy: getDefaultLocalApiAccessPolicy(),
      requiredScope: 'project:read',
      projectId: 'sample-project',
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('none');
  });

  it('represents passcode mode for local shared usage', () => {
    const result = verifyApiAccess({
      policy: getPasscodeApiAccessPolicy('local-passcode-hash'),
      projectId: 'sample-project',
    });

    expect(result.ok).toBe(true);
    expect(result.mode).toBe('passcode');
  });

  it('defers shared server authentication to Phase 4 provider', () => {
    const result = verifyApiAccess({
      policy: getPhase4ServerApiAccessPolicy(),
      projectId: 'sample-project',
    });

    expect(result.ok).toBe(false);
    expect(result.mode).toBe('phase4');
    expect(result.reason).toContain('Phase 4');
  });

  it('checks project-scoped API token scopes', () => {
    const token = createSampleProjectApiToken('sample-project');
    const passed = verifyApiAccess({
      policy: { mode: 'api_token', allowLocalNoAuth: false },
      token,
      requiredScope: 'project:read',
      projectId: 'sample-project',
    });
    const failed = verifyApiAccess({
      policy: { mode: 'api_token', allowLocalNoAuth: false },
      token,
      requiredScope: 'project:write',
      projectId: 'other-project',
    });

    expect(passed.ok).toBe(true);
    expect(passed.scopes).toContain('project:read');
    expect(failed.ok).toBe(false);
    expect(failed.reason).toContain('project scope');
  });
});
