import { describe, expect, it } from 'vitest';
import {
  createFunding,
  getFundingAgencyTypeLabel,
  getTemplateHintForFunding,
  selectTemplateHintForFundingList,
} from '../../src/domain/funding';

describe('funding domain', () => {
  it('creates funding information with agency, program, number, period, and URL', () => {
    const funding = createFunding({
      id: 'funding-1',
      agencyName: '日本学術振興会',
      agencyType: 'kakenhi',
      programName: '科学研究費助成事業',
      projectNumber: '26K00001',
      fiscalYear: '2026',
      period: {
        startDate: '2026-04-01',
        endDate: '2029-03-31',
      },
      url: 'https://www.jsps.go.jp/',
    });

    expect(funding.agencyName).toBe('日本学術振興会');
    expect(funding.programName).toBe('科学研究費助成事業');
    expect(funding.projectNumber).toBe('26K00001');
    expect(funding.period?.endDate).toBe('2029-03-31');
    expect(getFundingAgencyTypeLabel(funding.agencyType)).toBe('科研費');
  });

  it('uses agency type for template selection hints', () => {
    expect(
      getTemplateHintForFunding(
        createFunding({
          id: 'funding-nih',
          agencyName: 'National Institutes of Health',
          agencyType: 'nih',
          programName: 'Data Management and Sharing Plan',
        }),
      ),
    ).toBe('nih-style-v1');

    expect(
      getTemplateHintForFunding(
        createFunding({
          id: 'funding-kakenhi',
          agencyName: '日本学術振興会',
          agencyType: 'kakenhi',
          programName: '科学研究費助成事業',
        }),
      ),
    ).toBe('japanese-funder-jp-v1');

    expect(
      selectTemplateHintForFundingList([
        createFunding({
          id: 'funding-other',
          agencyName: '民間財団',
          agencyType: 'foundation',
          programName: '研究助成',
        }),
        createFunding({
          id: 'funding-university',
          agencyName: 'メタ大学',
          agencyType: 'university',
          programName: '学内研究助成',
        }),
      ]),
    ).toBe('university-basic-v1');
  });

  it('rejects invalid funding periods and URLs', () => {
    expect(() =>
      createFunding({
        id: 'funding-1',
        agencyName: '日本学術振興会',
        agencyType: 'kakenhi',
        programName: '科学研究費助成事業',
        period: {
          startDate: '2029-04-01',
          endDate: '2026-03-31',
        },
        url: 'not-a-url',
      }),
    ).toThrow();
  });
});
