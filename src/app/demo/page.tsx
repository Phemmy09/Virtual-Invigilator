'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function EmbeddedSDKDemo() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Dynamically load omniguard-sdk.js
    const script = document.createElement('script');
    script.src = '/sdk/omniguard-sdk.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.OmniGuard) {
        // @ts-ignore
        window.OmniGuard.init({
          examId: 'HARVARD-CS50-MIDTERM',
          studentId: 'STUDENT-8942',
          matricNumber: 'HVD-2026-8942',
          subject: 'CS50 - Artificial Intelligence',
          onViolation: (evt: any) => {
            setLogs((prev) => [
              `[${new Date().toLocaleTimeString()}] ${evt.eventType.toUpperCase()} (${evt.severity}): ${evt.details}`,
              ...prev,
            ]);
          },
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <Link href="/" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 700 }}>
          ← Institutional Portal
        </Link>
        <div className="badge-status badge-green">● SDK Active on Third-Party Website</div>
      </div>

      <div className="glass-panel" style={{ padding: '40px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
          Third-Party LMS Integration Demo
        </h2>
        <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '24px' }}>
          This page simulates an external university exam platform (such as Canvas, Blackboard, or Moodle). Notice the glowing <strong>OmniGuard AI</strong> widget floating in the bottom-right corner of the window.
        </p>

        {/* Integration Code Snippet */}
        <div style={{ background: '#090d16', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)', fontFamily: 'monospace', fontSize: '0.9rem', color: '#38bdf8', overflowX: 'auto', marginBottom: '32px' }}>
          <pre>{`<!-- 1. Include OmniGuard Universal SDK -->
<script src="https://omniguard.ai/sdk/omniguard-sdk.js"></script>

<!-- 2. Initialize with Exam Configuration -->
<script>
  OmniGuard.init({
    examId: 'HARVARD-CS50-MIDTERM',
    studentId: 'STUDENT-8942',
    matricNumber: 'HVD-2026-8942',
    subject: 'CS50 - Artificial Intelligence',
    onViolation: function(event) {
      console.warn('Security violation reported to LMS:', event);
    }
  });
</script>`}</pre>
        </div>

        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#ffffff' }}>Interactive Security Test Sandbox</h3>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
          Try performing the following actions to test host lockdown and real-time SDK telemetry:
        </p>

        <ul style={{ color: '#cbd5e1', fontSize: '0.95rem', paddingLeft: '20px', lineHeight: 1.8, marginBottom: '32px' }}>
          <li><strong>Switch Tabs / Minimize Window</strong> (triggers `tab_switch` event).</li>
          <li><strong>Right-Click Anywhere</strong> (triggers `clipboard_attempt` lockdown).</li>
          <li><strong>Press F12 or Ctrl+Shift+I</strong> (triggers `keystroke_anomaly` DevTools warning).</li>
          <li><strong>Speak Loudly or Turn Head Away</strong> (triggers acoustic or face absence warning in widget).</li>
        </ul>

        {/* Real-time Event Stream */}
        <h4 style={{ fontSize: '1rem', color: '#06b6d4', marginBottom: '12px' }}>📡 Live SDK Violation Callback Log:</h4>
        <div style={{ background: 'rgba(0, 0, 0, 0.6)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', minHeight: '120px', maxHeight: '200px', overflowY: 'auto' }}>
          {logs.length === 0 ? (
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>No violations recorded yet. Try switching tabs or speaking loudly...</span>
          ) : (
            logs.map((log, idx) => (
              <div key={idx} style={{ color: '#f43f5e', fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: '4px' }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
