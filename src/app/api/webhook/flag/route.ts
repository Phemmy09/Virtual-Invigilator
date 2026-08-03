import { NextResponse } from 'next/server';

const EXTERNAL_WEBHOOK_URL = 'https://examportalv2apitest.azurewebsites.net/api/v1/Proctor/flag';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      flagId = `flag_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      candidateId = 'a5c69632941a4c99ad0d028e64eac468',
      examId = '568',
      type = 'SUSPICIOUS_ACTIVITY',
      domain = 'AI_TESTING',
      mediaUrl = '',
      description = 'Proctor security event detected',
      event = 'AI_FLAG',
      tenantCode = 'MASTER',
    } = body;

    const payload = {
      flagId,
      candidateId,
      examId,
      type,
      domain,
      mediaUrl,
      description,
      event,
    };

    console.log('[Webhook Proxy] Forwarding flag payload to Azure API:', payload);

    const response = await fetch(EXTERNAL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'TenantCode': tenantCode || 'MASTER',
        'Content-Type': 'application/json-patch+json',
      },
      body: JSON.stringify(payload),
    });

    let resultData = null;
    try {
      const text = await response.text();
      resultData = text ? JSON.parse(text) : { status: response.status, message: response.statusText };
    } catch {
      resultData = { status: response.status, message: response.statusText };
    }

    if (!response.ok) {
      console.warn(`[Webhook Proxy] External API returned status ${response.status}:`, resultData);
    } else {
      console.log('[Webhook Proxy] External API success response:', resultData);
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      sentPayload: payload,
      apiResponse: resultData,
    });
  } catch (err: any) {
    console.error('[Webhook Proxy Error]:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal proxy error',
    }, { status: 500 });
  }
}
