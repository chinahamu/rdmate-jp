import { z } from 'zod';

export const externalIdentifierTypeValues = ['orcid', 'ror', 'doi'] as const;
export type ExternalIdentifierType = (typeof externalIdentifierTypeValues)[number];

export const externalIdentifierEntityTypeValues = [
  'researcher',
  'institution',
  'paper',
  'dataset',
  'software',
] as const;
export type ExternalIdentifierEntityType = (typeof externalIdentifierEntityTypeValues)[number];

export const externalIdentityConnectionStatusValues = ['manual', 'oauth_ready', 'oauth_connected'] as const;
export type ExternalIdentityConnectionStatus = (typeof externalIdentityConnectionStatusValues)[number];

export const orcidIdentifierSchema = z
  .string()
  .transform((value) => normalizeOrcidId(value))
  .refine((value) => /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(value), {
    message: 'ORCIDは0000-0000-0000-0000形式で入力してください。',
  })
  .refine((value) => isValidOrcidChecksum(value), {
    message: 'ORCIDのチェックディジットが正しくありません。',
  });

export const rorIdentifierSchema = z
  .string()
  .transform((value) => normalizeRorId(value))
  .refine((value) => /^0[a-z0-9]{6}\d{2}$/.test(value), {
    message: 'ROR IDは0で始まる9文字のIDで入力してください。',
  });

export const doiIdentifierSchema = z
  .string()
  .transform((value) => normalizeDoi(value))
  .refine((value) => /^10\.\d{4,9}\/\S+$/i.test(value), {
    message: 'DOIは10.xxxx/xxxxx形式で入力してください。',
  });

export const externalIdentityConnectionSchema = z.object({
  status: z.enum(externalIdentityConnectionStatusValues).default('manual'),
  provider: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  scope: z.array(z.string().min(1)).default([]),
  connectedAt: z.string().datetime().optional(),
});

export const externalIdentifierSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(externalIdentifierTypeValues),
    entityType: z.enum(externalIdentifierEntityTypeValues),
    entityId: z.string().min(1),
    label: z.string().min(1).optional(),
    value: z.string().min(1),
    resolveUrl: z.string().url().optional(),
    connection: externalIdentityConnectionSchema.default({ status: 'manual', scope: [] }),
    verifiedAt: z.string().datetime().optional(),
  })
  .transform((identifier) => {
    const value = normalizeIdentifierValue(identifier.type, identifier.value);

    return {
      ...identifier,
      value,
      resolveUrl: identifier.resolveUrl ?? getExternalIdentifierResolveUrl(identifier.type, value),
    };
  })
  .superRefine((identifier, context) => {
    const parsed = parseIdentifierValue(identifier.type, identifier.value);
    if (!parsed.success) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: parsed.error,
      });
    }

    if (identifier.type === 'orcid' && identifier.entityType !== 'researcher') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entityType'],
        message: 'ORCIDはresearcherに紐付けてください。',
      });
    }

    if (identifier.type === 'ror' && identifier.entityType !== 'institution') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entityType'],
        message: 'ROR IDはinstitutionに紐付けてください。',
      });
    }

    if (identifier.type === 'doi' && !['paper', 'dataset', 'software'].includes(identifier.entityType)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entityType'],
        message: 'DOIはpaper / dataset / softwareに紐付けてください。',
      });
    }
  });

export const institutionIdentifierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, '機関名は必須です。'),
  rorId: rorIdentifierSchema,
  aliases: z.array(z.string().min(1)).default([]),
  countryCode: z.string().length(2).optional(),
});

export type ExternalIdentityConnection = z.infer<typeof externalIdentityConnectionSchema>;
export type ExternalIdentifierInput = z.input<typeof externalIdentifierSchema>;
export type ExternalIdentifier = z.infer<typeof externalIdentifierSchema>;
export type InstitutionIdentifierInput = z.input<typeof institutionIdentifierSchema>;
export type InstitutionIdentifier = z.infer<typeof institutionIdentifierSchema>;

export type DataCiteAffiliationIdentifier = Readonly<{
  name: string;
  affiliationIdentifier?: string;
  affiliationIdentifierScheme?: 'ROR';
  schemeUri?: string;
}>;

export type DataCiteNameIdentifier = Readonly<{
  nameIdentifier: string;
  nameIdentifierScheme: 'ORCID';
  schemeUri: string;
}>;

export type DataCiteCreatorIdentifierPayload = Readonly<{
  name: string;
  nameIdentifiers?: DataCiteNameIdentifier[];
  affiliation: DataCiteAffiliationIdentifier[];
}>;

export function createExternalIdentifier(input: ExternalIdentifierInput): ExternalIdentifier {
  return externalIdentifierSchema.parse(input);
}

export function createResearcherOrcidIdentifier(input: {
  entityId: string;
  name: string;
  orcid: string;
  connection?: ExternalIdentityConnection;
  verifiedAt?: string;
}): ExternalIdentifier {
  const value = orcidIdentifierSchema.parse(input.orcid);

  return createExternalIdentifier({
    id: `orcid-${input.entityId}`,
    type: 'orcid',
    entityType: 'researcher',
    entityId: input.entityId,
    label: input.name,
    value,
    connection: input.connection ?? { status: 'manual', scope: [] },
    verifiedAt: input.verifiedAt,
  });
}

export function createInstitutionRorIdentifier(input: InstitutionIdentifierInput): InstitutionIdentifier {
  return institutionIdentifierSchema.parse(input);
}

export function createInstitutionExternalIdentifier(input: InstitutionIdentifier): ExternalIdentifier {
  return createExternalIdentifier({
    id: `ror-${input.id}`,
    type: 'ror',
    entityType: 'institution',
    entityId: input.id,
    label: input.name,
    value: input.rorId,
  });
}

export function createDoiExternalIdentifier(input: {
  entityType: Extract<ExternalIdentifierEntityType, 'paper' | 'dataset' | 'software'>;
  entityId: string;
  label: string;
  doi: string;
}): ExternalIdentifier {
  const value = doiIdentifierSchema.parse(input.doi);

  return createExternalIdentifier({
    id: `doi-${input.entityType}-${input.entityId}`,
    type: 'doi',
    entityType: input.entityType,
    entityId: input.entityId,
    label: input.label,
    value,
  });
}

export function getExternalIdentifierResolveUrl(type: ExternalIdentifierType, value: string): string {
  if (type === 'orcid') return `https://orcid.org/${normalizeOrcidId(value)}`;
  if (type === 'ror') return `https://ror.org/${normalizeRorId(value)}`;

  return `https://doi.org/${normalizeDoi(value)}`;
}

export function toDataCiteCreatorIdentifierPayload(input: {
  name: string;
  orcid?: string;
  affiliation: string;
  affiliationRorId?: string;
}): DataCiteCreatorIdentifierPayload {
  const affiliation = input.affiliationRorId
    ? [
        {
          name: input.affiliation,
          affiliationIdentifier: getExternalIdentifierResolveUrl('ror', input.affiliationRorId),
          affiliationIdentifierScheme: 'ROR' as const,
          schemeUri: 'https://ror.org/',
        },
      ]
    : [{ name: input.affiliation }];

  const parsedOrcid = input.orcid ? orcidIdentifierSchema.parse(input.orcid) : undefined;

  return {
    name: input.name,
    nameIdentifiers: parsedOrcid
      ? [
          {
            nameIdentifier: getExternalIdentifierResolveUrl('orcid', parsedOrcid),
            nameIdentifierScheme: 'ORCID',
            schemeUri: 'https://orcid.org/',
          },
        ]
      : undefined,
    affiliation,
  };
}

export function normalizeOrcidId(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/orcid\.org\//i, '')
    .replace(/^orcid:/i, '')
    .toUpperCase();
}

export function normalizeRorId(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/ror\.org\//i, '')
    .toLowerCase();
}

export function normalizeDoi(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:/i, '')
    .toLowerCase();
}

export function isValidOrcidChecksum(orcid: string): boolean {
  const normalized = normalizeOrcidId(orcid).replace(/-/g, '');
  if (!/^\d{15}[\dX]$/.test(normalized)) return false;

  let total = 0;
  for (const digit of normalized.slice(0, 15)) {
    total = (total + Number(digit)) * 2;
  }

  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const expected = result === 10 ? 'X' : String(result);

  return normalized[15] === expected;
}

function normalizeIdentifierValue(type: ExternalIdentifierType, value: string): string {
  if (type === 'orcid') return normalizeOrcidId(value);
  if (type === 'ror') return normalizeRorId(value);

  return normalizeDoi(value);
}

function parseIdentifierValue(type: ExternalIdentifierType, value: string): { success: true } | { success: false; error: string } {
  const schema = type === 'orcid' ? orcidIdentifierSchema : type === 'ror' ? rorIdentifierSchema : doiIdentifierSchema;
  const parsed = schema.safeParse(value);

  return parsed.success ? { success: true } : { success: false, error: parsed.error.issues[0]?.message ?? '外部識別子の形式が正しくありません。' };
}
