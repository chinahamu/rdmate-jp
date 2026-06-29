#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ifEmpty = process.argv.includes('--if-empty');

async function main() {
  if (ifEmpty) {
    const count = await prisma.researchProject.count();
    if (count > 0) {
      console.log('Sample data already exists. Skipping seed.');
      return;
    }
  }

  await prisma.researchProject.create({
    data: {
      title: 'RDMate JP サンプル研究課題',
      summary: 'ローカル開発・デモ用の研究課題です。DMP、Dataset台帳、メタデータ、保存場所をまとめて確認できます。',
      field: '研究データ管理',
      startDate: new Date('2026-04-01T00:00:00+09:00'),
      expectedEndDate: new Date('2027-03-31T00:00:00+09:00'),
      status: 'active',
      projectNumber: 'RDMATE-SAMPLE-001',
      institutionLocalProjectCode: 'META-RDM-2026-001',
      preferredDmpLanguage: 'ja',
      dataManagerName: 'サンプル データスチュワード',
      dataManagerMemberId: 'sample-steward',
      members: {
        create: [
          {
            id: 'sample-pi',
            name: 'サンプル 研究代表者',
            nameJa: 'サンプル 研究代表者',
            nameEn: 'Sample Principal Investigator',
            affiliation: 'サンプル大学 情報学部 情報システム学科 研究データ管理研究室',
            affiliationInstitution: 'サンプル大学',
            affiliationFaculty: '情報学部',
            affiliationDepartment: '情報システム学科',
            affiliationLaboratory: '研究データ管理研究室',
            role: 'PI',
            email: 'pi@example.invalid',
            orcid: '0000-0000-0000-0000',
          },
          {
            id: 'sample-steward',
            name: 'サンプル データスチュワード',
            nameJa: 'サンプル データスチュワード',
            nameEn: 'Sample Data Steward',
            affiliation: 'サンプル大学 附属図書館 研究データ支援部門',
            affiliationInstitution: 'サンプル大学',
            affiliationFaculty: '附属図書館',
            affiliationDepartment: '研究データ支援部門',
            role: 'DATA_STEWARD',
            email: 'steward@example.invalid',
          },
        ],
      },
      funding: {
        create: [
          {
            agencyName: '日本学術振興会',
            agencyType: 'kakenhi',
            programName: '科学研究費助成事業',
            projectNumber: '26K00001',
            grantNumber: '26K00001',
            fiscalYear: '2026',
            periodStart: new Date('2026-04-01T00:00:00+09:00'),
            periodEnd: new Date('2027-03-31T00:00:00+09:00'),
            url: 'https://www.jsps.go.jp/',
          },
        ],
      },
      datasets: {
        create: [
          {
            name: '研究データ管理アンケート集計',
            description: 'RDMate JPのローカルデモで利用する匿名化済みアンケート集計データの台帳サンプルです。',
            dataType: 'survey_data',
            generatedDate: new Date('2026-05-01T00:00:00+09:00'),
            lastUpdatedDate: new Date('2026-05-20T00:00:00+09:00'),
            version: '1.0.0',
            status: 'reviewed',
            createdBy: 'sample-steward',
            responsibleMemberId: 'sample-steward',
            publicationStatus: 'restricted',
            plannedPublicationDate: new Date('2027-04-01T00:00:00+09:00'),
            publicUrl: 'https://repository.example.invalid/datasets/rdmate-survey',
            doi: '10.0000/example.rdmate-survey',
            license: 'CC BY 4.0',
            usageTerms: '利用申請後に匿名化済み集計データを共有します。',
            citation: 'RDMate JP sample dataset, 2026.',
            storageLocations: {
              create: [
                {
                  label: '外部RDM基盤',
                  uri: 'https://rdm.example.invalid/sample-project/survey',
                  storageType: 'gakunin_rdm',
                  accessScope: 'project_members',
                  hasBackup: true,
                  isEncrypted: true,
                  notes: '実データ本体はRDMate JPに保存せず、参照情報のみ登録します。',
                },
              ],
            },
            fileManifestEntries: {
              create: [
                {
                  fileName: 'survey-summary.csv',
                  relativePath: 'processed/survey-summary.csv',
                  sizeBytes: 2048n,
                  hashAlgorithm: 'sha256',
                  hashValue: 'sample-hash-value-for-local-development',
                  mimeType: 'text/csv',
                  modifiedAt: new Date('2026-05-20T00:00:00+09:00'),
                },
              ],
            },
            metadata: {
              create: {
                title: '研究データ管理アンケート集計',
                description: 'RDMate JPのデモで利用する匿名化済み集計データのメタデータです。',
                researchField: '研究データ管理',
                acquisitionMethod: 'オンラインアンケートの匿名化済み集計',
                language: 'ja',
                publisher: 'サンプル大学',
                rightsHolder: 'サンプル大学',
                temporalStartDate: new Date('2026-04-01T00:00:00+09:00'),
                temporalEndDate: new Date('2026-05-31T00:00:00+09:00'),
                spatialPlaceName: '日本',
                creators: {
                  create: [
                    {
                      name: 'サンプル 研究代表者',
                      affiliation: 'サンプル大学 情報学部',
                      role: 'creator',
                    },
                  ],
                },
                keywords: {
                  create: [{ keyword: 'RDM' }, { keyword: 'DMP' }, { keyword: '研究データ管理' }],
                },
                variables: {
                  create: [
                    {
                      name: 'response_count',
                      label: '回答数',
                      description: '匿名化済み集計に含まれる回答数。',
                      dataType: 'integer',
                      unit: 'count',
                    },
                  ],
                },
                relatedPapers: {
                  create: [
                    {
                      title: 'RDMate JP local sample paper',
                      paperType: 'preprint',
                      url: 'https://example.invalid/papers/rdmate-local-sample',
                      publicationYear: '2026',
                      relation: 'isSupplementTo',
                    },
                  ],
                },
              },
            },
            publicationDecision: {
              create: {
                containsPersonalInformation: false,
                hasCollaborativeAgreement: false,
                hasPatentPlan: false,
                personalInformationHandling: '匿名化済み集計データのみを公開候補とします。',
                reviewedBy: 'sample-pi',
                reviewedAt: new Date('2026-06-01T00:00:00+09:00'),
              },
            },
          },
        ],
      },
    },
  });

  console.log('Sample data seeded.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
