import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import type { DmpExportContext } from '../domain/dmp-export';
import { generateDmpMarkdown } from '../domain/dmp-export';

export async function generateDmpDocxBuffer(context: DmpExportContext): Promise<Buffer> {
  const markdown = generateDmpMarkdown(context);
  const document = markdownToDocxDocument(markdown);

  return Packer.toBuffer(document);
}

export function markdownToDocxDocument(markdown: string): Document {
  const children = markdownToDocxChildren(markdown);

  return new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });
}

export function markdownToDocxChildren(markdown: string): Array<Paragraph | Table> {
  const children: Array<Paragraph | Table> = [];
  const lines = markdown.split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? '';

    if (line.trim().length === 0) {
      index += 1;
      continue;
    }

    if (line.startsWith('# ')) {
      children.push(
        new Paragraph({
          text: line.slice(2),
          heading: HeadingLevel.TITLE,
        }),
      );
      index += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          text: line.slice(3),
          heading: HeadingLevel.HEADING_1,
        }),
      );
      index += 1;
      continue;
    }

    if (isMarkdownTableStart(lines, index)) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index]?.startsWith('|')) {
        tableLines.push(lines[index] ?? '');
        index += 1;
      }
      children.push(markdownTableToDocxTable(tableLines));
      continue;
    }

    children.push(new Paragraph({ children: [new TextRun(line)] }));
    index += 1;
  }

  return children;
}

function isMarkdownTableStart(lines: string[], index: number): boolean {
  return Boolean(lines[index]?.startsWith('|') && lines[index + 1]?.includes('---'));
}

function markdownTableToDocxTable(lines: string[]): Table {
  const rows = lines
    .filter((line) => !/^\|\s*-+/.test(line))
    .map((line) => splitMarkdownTableRow(line))
    .map(
      (cells) =>
        new TableRow({
          children: cells.map(
            (cell) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun(cell.replaceAll('<br>', '\n'))] })],
              }),
          ),
        }),
    );

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows,
  });
}

function splitMarkdownTableRow(line: string): string[] {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.replaceAll('\\|', '|').trim());
}
