import { NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/lib/pdf-parser';
import { detectField } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('pdf') as File | null;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF file required' }, { status: 400 });
    }
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text } = await extractTextFromPDF(buffer);

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF. Try re-exporting from LinkedIn.' },
        { status: 422 }
      );
    }

    const field = detectField(text);

    return NextResponse.json({ text, field });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process PDF. Please try again.' },
      { status: 500 }
    );
  }
}
