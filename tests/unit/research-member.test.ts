import { describe, expect, it } from 'vitest';
import {
  createResearchMember,
  getDmpResponsibleCandidates,
  getResearchMemberExternalIdentifiers,
  getResearchMemberRoleLabel,
  isDmpResponsibleCandidate,
} from '../../src/domain/research-member';

describe('research member domain', () => {
  it('creates a research member with optional ORCID and affiliation ROR ID', () => {
    const member = createResearchMember({
      id: 'member-1',
      name: '山田 太郎',
      affiliation: 'メタ大学 情報学部',
      affiliationRorId: '03yrm5c26',
      role: 'PI',
      email: 'taro.yamada@example.ac.jp',
      orcid: '0000-0002-1825-0097',
    });

    const identifiers = getResearchMemberExternalIdentifiers(member);

    expect(member.role).toBe('PI');
    expect(member.orcid).toBe('0000-0002-1825-0097');
    expect(member.affiliationRorId).toBe('03yrm5c26');
    expect(identifiers.map((identifier) => identifier.type)).toEqual(['orcid', 'ror']);
    expect(getResearchMemberRoleLabel(member.role)).toBe('研究代表者');
  });

  it('supports PI / Co-I / Data Steward / Student / External Collaborator roles', () => {
    expect(getResearchMemberRoleLabel('PI')).toBe('研究代表者');
    expect(getResearchMemberRoleLabel('CO_I')).toBe('共同研究者');
    expect(getResearchMemberRoleLabel('DATA_STEWARD')).toBe('研究データ管理担当者');
    expect(getResearchMemberRoleLabel('STUDENT')).toBe('学生');
    expect(getResearchMemberRoleLabel('EXTERNAL_COLLABORATOR')).toBe('外部共同研究者');
  });

  it('selects DMP responsible candidates in priority order', () => {
    const members = [
      createResearchMember({
        id: 'student',
        name: '学生 A',
        affiliation: 'メタ大学',
        role: 'STUDENT',
        email: 'student@example.ac.jp',
      }),
      createResearchMember({
        id: 'pi',
        name: 'PI A',
        affiliation: 'メタ大学',
        role: 'PI',
        email: 'pi@example.ac.jp',
      }),
      createResearchMember({
        id: 'steward',
        name: 'Steward A',
        affiliation: 'メタ大学図書館',
        role: 'DATA_STEWARD',
        email: 'steward@example.ac.jp',
      }),
      createResearchMember({
        id: 'coi',
        name: 'Co-I A',
        affiliation: '共同研究機構',
        role: 'CO_I',
        email: 'coi@example.org',
      }),
    ];

    expect(isDmpResponsibleCandidate(members[0]!)).toBe(false);
    expect(getDmpResponsibleCandidates(members).map((member) => member.id)).toEqual([
      'steward',
      'pi',
      'coi',
    ]);
  });

  it('rejects invalid email, ORCID, and ROR values', () => {
    expect(() =>
      createResearchMember({
        id: 'member-1',
        name: '山田 太郎',
        affiliation: 'メタ大学 情報学部',
        affiliationRorId: 'invalid-ror',
        role: 'PI',
        email: 'invalid-email',
        orcid: 'invalid-orcid',
      }),
    ).toThrow();
  });
});
