// pdf-parse v1 has a known Next.js issue — the default import tries to
// read a test PDF from the filesystem during initialization.
// Using the direct path bypasses this.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse');

export async function extractTextFromPDF(buffer: Buffer): Promise<{
  text: string;
  pages: number;
}> {
  const data = await pdfParse(buffer);
  return {
    text: data.text,
    pages: data.numpages,
  };
}
