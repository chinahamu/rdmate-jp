'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  dmpLabelDefinitions,
  type DmpAnswerValue,
  type DmpFormSection,
  type DmpValidationIssue,
} from '@/domain/dmp-answer';
import { DmpFormField } from './dmp-form-field';

type DmpSectionFormProps = Readonly<{
  section: DmpFormSection;
  issues?: DmpValidationIssue[];
}>;

type StoredSectionAnswers = Record<string, DmpAnswerValue>;

const DMP_SECTION_STORAGE_PREFIX = 'rdmate-jp:dmp-editor:section';

export function DmpSectionForm({ section, issues = [] }: DmpSectionFormProps) {
  const sectionIssues = issues.filter((issue) => issue.sectionId === section.id);
  const formRef = useRef<HTMLFormElement>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const savedAnswers = readSectionAnswers(section.id);
    if (!savedAnswers) return;

    applySectionAnswers(form, savedAnswers);
  }, [section.id]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const answers = collectSectionAnswers(event.currentTarget);
    window.sessionStorage.setItem(getSectionStorageKey(section.id), JSON.stringify(answers));
    setStatusMessage('セクションを保存しました。入力内容はこの画面に維持されます。');
  };

  return (
    <form
      ref={formRef}
      className="dmp-section-form"
      aria-labelledby={`${section.id}-heading`}
      onSubmit={handleSubmit}
    >
      <div className="dmp-section-form__header">
        <div>
          <p className="eyebrow">{section.id}</p>
          <h2 id={`${section.id}-heading`}>{section.title}</h2>
          {section.description ? <p>{section.description}</p> : null}
        </div>
        <span className="template-card__badge">
          {section.completedRequiredCount}/{section.requiredCount} 必須完了
        </span>
      </div>

      {sectionIssues.length > 0 ? (
        <div className="dmp-issues" role="status">
          <p>確認事項</p>
          <ul>
            {sectionIssues.map((issue) => (
              <li key={`${issue.fieldId}-${issue.message}`} data-severity={issue.severity}>
                <a href={`#${issue.fieldId}`}>{issue.message}</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="dmp-section-form__fields">
        {section.fields.map((field) => (
          <DmpFormField key={field.fieldId} field={field} />
        ))}
      </div>

      <button className="secondary-button" type="submit">
        {dmpLabelDefinitions.ja.saveSection}
      </button>
      {statusMessage ? (
        <p className="form-note" role="status">
          {statusMessage}
        </p>
      ) : null}
    </form>
  );
}

function getSectionStorageKey(sectionId: string): string {
  return `${DMP_SECTION_STORAGE_PREFIX}:${sectionId}`;
}

function readSectionAnswers(sectionId: string): StoredSectionAnswers | null {
  const item = window.sessionStorage.getItem(getSectionStorageKey(sectionId));
  if (!item) return null;

  try {
    const parsed: unknown = JSON.parse(item);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;

    return parsed as StoredSectionAnswers;
  } catch {
    return null;
  }
}

function collectSectionAnswers(form: HTMLFormElement): StoredSectionAnswers {
  const answers: StoredSectionAnswers = {};
  const controls = getNamedControls(form);
  const names = Array.from(new Set(controls.map((control) => control.name)));

  for (const name of names) {
    const control = controls.find((element) => element.name === name);
    if (!control) continue;

    if (control instanceof HTMLSelectElement && control.multiple) {
      answers[name] = Array.from(control.selectedOptions).map((option) => option.value);
      continue;
    }

    if (control instanceof HTMLInputElement && control.type === 'checkbox') {
      answers[name] = control.checked;
      continue;
    }

    if (control instanceof HTMLInputElement && control.type === 'number') {
      answers[name] = control.value === '' ? null : Number(control.value);
      continue;
    }

    answers[name] = control.value;
  }

  return answers;
}

function applySectionAnswers(form: HTMLFormElement, answers: StoredSectionAnswers) {
  const controls = getNamedControls(form);

  for (const [name, value] of Object.entries(answers)) {
    const matchingControls = controls.filter((control) => control.name === name);

    for (const control of matchingControls) {
      if (control instanceof HTMLSelectElement && control.multiple) {
        const selectedValues = Array.isArray(value) ? value : [];
        for (const option of Array.from(control.options)) {
          option.selected = selectedValues.includes(option.value);
        }
        continue;
      }

      if (control instanceof HTMLInputElement && control.type === 'checkbox') {
        control.checked = value === true || value === 'true' || value === '該当する';
        continue;
      }

      control.value = stringifyFormValue(value);
    }
  }
}

function getNamedControls(form: HTMLFormElement) {
  return Array.from(form.elements).filter(
    (element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
      (element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement) &&
      element.name.length > 0,
  );
}

function stringifyFormValue(value: DmpAnswerValue): string {
  if (value === null || Array.isArray(value)) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';

  return String(value);
}
