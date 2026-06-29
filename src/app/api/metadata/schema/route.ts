import { getRdmateMetadataJsonSchema } from '@/domain/metadata';

export function GET() {
  return Response.json(getRdmateMetadataJsonSchema(), {
    headers: {
      'Content-Disposition': 'inline; filename="dataset-metadata.schema.json"',
    },
  });
}
