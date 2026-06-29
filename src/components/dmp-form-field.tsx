import { getExamplePhrasesForQuestion, type DmpFormField } from '@/domain/dmp-answer';

type DmpFormFieldProps = Readonly<{
  field: DmpFormField;
}>;

export function DmpFormField({ field }: DmpFormFieldProps) {
  const examples = getExamplePhrasesForQuestion(field.questionId);

  return (
    <div className="dmp-field">
      <label htmlFor={field.fieldId}>
        <span>{field.label}</span>
        <span className="dmp-field__required">{field.required ? '必須' : '任意'}</span>
      </label>
      {renderFieldControl(field)}
      {field.helpText ? <p className="dmp-field__help">{field.helpText}</p> : null}
      {examples.length > 0 ? (
        <div className="dmp-field__examples" aria-labelledby={`examples-heading-${field.fieldId}`}>
          <p id={`examples-heading-${field.fieldId}`}>文例</p>
          <ul>
            {examples.map((example) => (
              <li key={example.id}>{example.value}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function renderFieldControl(field: DmpFormField) {
  const name = field.fieldId;
  const value = field.value;

  switch (field.type) {
    case 'textarea':
      return <textarea id={field.fieldId} name={name} defaultValue={asText(value)} rows={5} />;
    case 'select':
      return (
        <select id={field.fieldId} name={name} defaultValue={asText(value)}>
          <option value="">選択してください</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case 'multi_select':
      return (
        <select id={field.fieldId} name={name} defaultValue={asTextArray(value)} multiple>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    case 'date':
      return <input id={field.fieldId} name={name} type="date" defaultValue={asText(value)} />;
    case 'url':
      return <input id={field.fieldId} name={name} type="url" defaultValue={asText(value)} />;
    case 'number':
      return <input id={field.fieldId} name={name} type="number" defaultValue={asText(value)} />;
    case 'boolean':
      return (
        <label className="checkbox-field">
          <input id={field.fieldId} name={name} type="checkbox" defaultChecked={value === true} />
          該当する
        </label>
      );
    case 'text':
    default:
      return <input id={field.fieldId} name={name} type="text" defaultValue={asText(value)} />;
  }
}

function asText(value: DmpFormField['value']): string {
  if (value === null || Array.isArray(value)) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';

  return String(value);
}

function asTextArray(value: DmpFormField['value']): string[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.length > 0) return [value];

  return [];
}
