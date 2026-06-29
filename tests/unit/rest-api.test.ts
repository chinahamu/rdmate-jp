import { describe, expect, it } from 'vitest';
import { apiEnvelope, listApiDatasets, listApiDmps, listApiExports, listApiProjects, listApiTemplates } from '../../src/server/api-resources';

describe('Phase 3 REST endpoints', () => {
  it('builds resource payloads for public GET endpoints', () => {
    expect(listApiProjects()[0]?.id).toBe('sample-project');
    expect(listApiDmps()[0]?.templateId).toBe('generic-jp-v2');
    expect(listApiDatasets().length).toBeGreaterThan(0);
    expect(listApiTemplates().map((template) => template.id)).toContain('generic-jp-v2');
    expect(listApiExports().length).toBe(4);
  });

  it('wraps payloads in a versioned envelope', () => {
    const response = apiEnvelope([{ id: 'sample' }]);

    expect(response.apiVersion).toBe('v1');
    expect(response.data[0]?.id).toBe('sample');
  });
});
