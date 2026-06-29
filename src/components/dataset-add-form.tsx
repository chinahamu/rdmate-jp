'use client';

import { useState, useEffect } from 'react';
import type { ResearchProject } from '@/domain/research-project';
import type { ResearchMember } from '@/domain/research-member';

type DatasetAddFormProps = Readonly<{
  project: ResearchProject;
  dataManager?: ResearchMember;
  datasetTypeValues: readonly string[];
  publicationStatusValues: readonly string[];
}>;

export function DatasetAddForm({
  project,
  dataManager,
  datasetTypeValues,
  publicationStatusValues,
}: DatasetAddFormProps) {
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState('追加テスト用データセット');
  const [dataType, setDataType] = useState('survey_data');
  const [responsibleMemberId, setResponsibleMemberId] = useState(dataManager?.id ?? '');
  const [publicationStatus, setPublicationStatus] = useState('undecided');
  const [userCsv, setUserCsv] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const calculatedCsv = [
    'id,project_id,name,description,data_type,generated_date,last_updated_date,version,status,created_by,responsible_member_id,publication_status,planned_publication_date,public_url,doi,license,usage_terms,citation,storage_locations',
    `dataset-new,${project.id},${name},追加テスト用の説明,${dataType},2026-06-29,,1.0.0,unchecked,佐藤 花子,${responsibleMemberId},${publicationStatus},,,,,,`,
  ].join('\n');

  const csvValue = userCsv !== null ? userCsv : calculatedCsv;

  return (
    <form
      className="dataset-import-form"
      action="/api/datasets/import"
      method="post"
      data-hydrated={hydrated}
    >
      <label>
        データセット名
        <input
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setUserCsv(null); // Reset custom edits when field is changed
          }}
        />
      </label>
      <label>
        データ種別
        <select
          name="dataType"
          value={dataType}
          onChange={(e) => {
            setDataType(e.target.value);
            setUserCsv(null);
          }}
        >
          {datasetTypeValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        責任者
        <select
          name="responsibleMemberId"
          value={responsibleMemberId}
          onChange={(e) => {
            setResponsibleMemberId(e.target.value);
            setUserCsv(null);
          }}
        >
          {project.members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        公開区分
        <select
          name="publicationStatus"
          value={publicationStatus}
          onChange={(e) => {
            setPublicationStatus(e.target.value);
            setUserCsv(null);
          }}
        >
          {publicationStatusValues.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <label>
        CSVプレビュー
        <textarea
          name="csv"
          value={csvValue}
          onChange={(e) => setUserCsv(e.target.value)}
          rows={6}
        />
      </label>
      <button className="secondary-button" type="submit">
        Dataset追加プレビューを生成
      </button>
    </form>
  );
}
