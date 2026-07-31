import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';

// In-memory store fallback for demo sessions when Supabase is not connected
const inMemoryLogs: { [sessionId: string]: any[] } = {};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, eventType, severity = 'medium', details = {} } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    // Determine trust penalty based on severity and flag category
    let penalty = 5;
    if (severity === 'critical' || eventType === 'face_mismatch' || eventType === 'multiple_faces') {
      penalty = 15;
    } else if (severity === 'medium' || eventType === 'tab_switch' || eventType === 'noise_spike' || eventType.startsWith('face_turn')) {
      penalty = 8;
    } else if (severity === 'low' || eventType === 'gaze_deviation') {
      penalty = 3;
    }

    let updatedTrustScore = 100;
    const key = sessionId || 'default-session';

    if (!inMemoryLogs[key]) {
      inMemoryLogs[key] = [];
    }

    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: key,
      eventType,
      severity,
      details,
      timestamp: new Date().toISOString(),
    };

    inMemoryLogs[key].unshift(logEntry);

    if (isSupabaseConfigured() && sessionId) {
      await supabase.from('proctoring_logs').insert({
        session_id: sessionId,
        event_type: eventType,
        severity,
        details,
        timestamp: new Date().toISOString(),
      });

      const { data: session } = await supabase
        .from('exam_sessions')
        .select('trust_score')
        .eq('id', sessionId)
        .single();

      if (session) {
        updatedTrustScore = Math.max(0, (session.trust_score || 100) - penalty);
        await supabase
          .from('exam_sessions')
          .update({ trust_score: updatedTrustScore })
          .eq('id', sessionId);
      }
    }

    return NextResponse.json({
      success: true,
      loggedEvent: eventType,
      severity,
      deductedPenalty: penalty,
      currentTrustScore: updatedTrustScore,
      logEntry,
      warningMessage: `SECURITY ALERT: ${eventType.toUpperCase().replace(/_/g, ' ')} detected. Recorded in audit log.`,
    });
  } catch (err: any) {
    console.error('Error in proctoring logs API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId') || 'default-session';
  const logs = inMemoryLogs[sessionId] || [];
  return NextResponse.json({ success: true, logs });
}
