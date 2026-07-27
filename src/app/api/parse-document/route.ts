import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { parseDocumentTextToQuestions } from '@/utils/openai';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    if (fileName.endsWith('.pdf')) {
      try {
        // Use require for pdf-parse module compatibility
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
      } catch (e) {
        console.warn('PDF parse failed, using direct string conversion fallback:', e);
        extractedText = buffer.toString('utf-8');
      }
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } catch (e) {
        console.warn('DOCX parse failed:', e);
        extractedText = buffer.toString('utf-8');
      }
    } else {
      // CSV, JSON, TXT files
      extractedText = buffer.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'Failed to extract readable text from document' }, { status: 422 });
    }

    // Process extracted text through OpenAI Document Ingestion pipeline
    const questions = await parseDocumentTextToQuestions(extractedText);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      questionsCount: questions.length,
      questions,
    });
  } catch (err: any) {
    console.error('Error parsing uploaded document:', err);
    return NextResponse.json({ error: err.message || 'Failed to process document' }, { status: 500 });
  }
}
