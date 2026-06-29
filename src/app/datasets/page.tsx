import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { DatasetLedger } from '@/components/dataset-ledger';
import {
  datasetLicenseValues,
  datasetStatusValues,
  datasetTypeValues,
  publicationStatusValues,
  type DatasetFilterCriteria,
} from '@/domain/dataset';
import { getSampleDatasets } from '@/server/sample-datasets';
import { getSampleResearchProject } from '@/server/sample-project';

export const metadata: Metadata = {
  title: 'データセット台帳 | RDMate JP',
};

type DatasetPageSearchParams = Record<string, string | string[] | undefined>;

type DatasetPageProps = Readonly<{
  searchParams?: Promise<DatasetPageSearchParams>;
}>;

export default async function DatasetPage({ searchParams }: DatasetPageProps) {
  const params = (await searchParams) ?? {};
  const project = getSampleResearchProject();
  const datasets = getSampleDatasets();
  const filters = toDatasetFilterCriteria(params);

  return (
    <AppShell>
      <section className="hero">
        <p className="eyebrow">RDM Lite</p>
        <h1>データセット台帳</h1>
        <p>
          研究課題ごとに、データセット名、説明、データ種別、責任者、保存場所、公開区分、ライセンスを管理します。実データ本体は保持せず、パス・URL・外部IDの参照を記録します。
        </p>
      </section>

      <DatasetLedger project={project} datasets={datasets} filters={filters} />
    </AppShell>
  );
}

function toDatasetFilterCriteria(params: DatasetPageSearchParams): DatasetFilterCriteria {
  return {
    dataType: getEnumParam(datasetTypeValues, params.dataType),
    status: getEnumParam(datasetStatusValues, params.status),
    publicationStatus: getEnumParam(publicationStatusValues, params.publicationStatus),
    responsibleMemberId: getStringParam(params.responsibleMemberId),
    license: getEnumParam(datasetLicenseValues, params.license),
  };
}

function getStringParam(value: string | string[] | undefined): string | undefined {
  const resolved = Array.isArray(value) ? value[0] : value;

  return resolved && resolved.trim().length > 0 ? resolved : undefined;
}

function getEnumParam<T extends string>(values: readonly T[], value: string | string[] | undefined): T | undefined {
  const resolved = getStringParam(value);

  return resolved && values.includes(resolved as T) ? (resolved as T) : undefined;
}
