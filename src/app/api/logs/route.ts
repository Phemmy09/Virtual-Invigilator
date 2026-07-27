import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/utils/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, eventType, severity = 'medium', details = {} } = body;

    if (!eventType) {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }

    // Determine trust penalty based on severity
    let penalty = 5;
    if (severity === 'critical' || eventType === 'face_mismatch' || eventType === 'multiple_faces') {
      penalty = 15;
    } else if (severity === 'medium' || eventType === 'tab_switch' || eventType === 'noise_spike') {
      penalty = 8;
    } else if (severity === 'low') {
      penalty = 3;
    }

    let updatedTrustScore = 100;

    if (isSupabaseConfigured() && sessionId) {
      // Log event
      await supabase.from('proctoring_logs').insert({
        session_id: sessionId,
        event_type: eventType,
        severity,
        details,
        timestamp: new Date().toISOString(),
      });

      // Fetch current trust score and update it
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
      warningMessage: `SECURITY ALERT: ${eventType.toUpperCase().replace('_', ' ')} detected. Recorded in institutional audit log.`,
    });
  } catch (err: any) {
    console.error('Error in proctoring logs API:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
