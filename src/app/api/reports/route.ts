import { NextResponse } from 'next/server';

// In-memory store for audit reports
const reportsStore: { [reportId: string]: any } = {};

export async function POST(req: Request) {
  try {
    const report = await req.json();
    if (!report.reportId) {
      report.reportId = `rep-${Date.now()}`;
    }

    reportsStore[report.reportId] = report;
    if (report.sessionId) {
      reportsStore[report.sessionId] = report;
    }

    console.log('[API /api/reports] Audit report stored successfully:', report.reportId);

    return NextResponse.json({
      success: true,
      reportId: report.reportId,
      message: 'Proctoring audit report stored successfully.',
      report,
    });
  } catch (err: any) {
    console.error('Error storing audit report:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || searchParams.get('sessionId');

  if (id && reportsStore[id]) {
    return NextResponse.json({ success: true, report: reportsStore[id] });
  }

  // Fallback: return the most recently saved report
  const allKeys = Object.keys(reportsStore);
  if (allKeys.length > 0) {
    const latestKey = allKeys[allKeys.length - 1];
    return NextResponse.json({ success: true, report: reportsStore[latestKey] });
  }

  return NextResponse.json({ success: false, message: 'No report found.' }, { status: 404 });
}
