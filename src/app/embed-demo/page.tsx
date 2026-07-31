'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    OmniGuard: any;
  }
}

export default function EmbedDemoPage() {
  const [isWidgetActive, setIsWidgetActive] = useState<boolean>(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'demo' | 'code'>('demo');
  const [reportData, setReportData] = useState<any | null>(null);

  useEffect(() => {
    // Load omniguard-sdk.js dynamically
    const script = document.createElement('script');
    script.src = '/sdk/omniguard-sdk.js';
    script.async = true;
    script.onload = () => {
      console.log('OmniGuard SDK script loaded.');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
      if (window.OmniGuard && typeof window.OmniGuard.destroy === 'function') {
        window.OmniGuard.destroy();
      }
    };
  }, []);

  const handleInitWidget = () => {
    if (window.OmniGuard) {
      window.OmniGuard.init({
        serverUrl: window.location.origin,
        examId: 'HARVARD-CS50-MIDTERM',
        studentId: 'Alex Mercer',
        matricNumber: 'HVD-2026-8942',
        studentName: 'Alex Mercer',
        subject: 'CS50 - Artificial Intelligence',
        strictLockdown: true,
        onViolation: (violation: any) => {
          console.log('[Host Webpage Callback] Violation captured:', violation);
          setLogs((prev) => [violation, ...prev]);
        },
        onReport: (report: any) => {
          console.log('[Host Webpage Callback] Audit Report received:', report);
          setReportData(report);
        },
      });
      setIsWidgetActive(true);
    } else {
      alert('OmniGuard SDK not loaded yet.');
    }
  };

  const handleStartExam = () => {
    if (window.OmniGuard) {
      window.OmniGuard.startExam();
    }
  };

  const handleSimulateFaceTurn = () => {
    if (window.OmniGuard) {
      window.OmniGuard.reportViolation(
        'face_turn_left',
        'medium',
        'SIMULATION: Candidate turned face 45 degrees away from camera.'
      );
    }
  };

  const handleSimulateNoise = () => {
    if (window.OmniGuard) {
      window.OmniGuard.reportViolation(
        'noise_spike',
        'medium',
        'SIMULATION: Loud ambient sound detected (78dB).'
      );
    }
  };

  const handleSimulateTabSwitch = () => {
    if (window.OmniGuard) {
      window.OmniGuard.reportViolation(
        'tab_switch',
        'medium',
        'SIMULATION: Student switched tab or minimized window.'
      );
    }
  };

  const handleFinishExam = () => {
    if (window.OmniGuard) {
      window.OmniGuard.finishExam((report: any) => {
        setReportData(report);
      });
    }
  };

  const handleExportJSON = () => {
    if (window.OmniGuard) {
      window.OmniGuard.exportReport();
    }
  };

  const htmlCodeSnippet = `<!-- 1. Include OmniGuard AI Proctoring SDK Script -->
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/sdk/omniguard-sdk.js"></script>

<!-- 2. Initialize OmniGuard Invigilator Widget -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    OmniGuard.init({
      serverUrl: '${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}',
      examId: 'CS50-AI-MIDTERM',
      studentId: 'STUDENT-8942',
      matricNumber: 'HVD-2026-8942',
      studentName: 'Alex Mercer',
      subject: 'CS50 - Artificial Intelligence',
      strictLockdown: true,
      widgetPosition: 'bottom-right',
      
      // Callback triggered on live flag (sound, face turn, tab switch)
      onViolation: function (violation) {
        console.warn('Proctor Flag Captured:', violation);
      },
      
      // Callback triggered when exam finishes with full audit report
      onReport: function (report) {
        console.log('Exam Report Payload:', report);
        // Send report to your backend database or redirect student
        fetch('/api/my-lms/save-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report)
        });
      }
    });
  });

  // Call when candidate clicks Submit Exam
  function onExamSubmitted() {
    OmniGuard.finishExam(function (report) {
      alert('Exam submitted with Trust Index: ' + report.trustScore + '%');
    });
  }
</script>`;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <Link href="/" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Back to Home
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveTab('demo')}
            className={activeTab === 'demo' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.85rem' }}
          >
            💻 Live Website Embed Demo
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={activeTab === 'code' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.85rem' }}
          >
            📜 Integration Code Snippet
          </button>
          <Link href="/report" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            📊 View Sample Report
          </Link>
        </div>
      </div>

      {activeTab === 'demo' && (
        <div>
          {/* SIMULATED THIRD PARTY UNIVERSITY WEBSITE */}
          <div className="glass-panel" style={{ padding: '36px', marginBottom: '32px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <span className="badge-status badge-green" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  🎓 HARVARD UNIVERSITY LMS - LIVE EXAM INTEGRATION
                </span>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>
                  CS50: Introduction to Artificial Intelligence - Midterm
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Candidate: <strong>Alex Mercer</strong> (HVD-2026-8942)
                </p>
              </div>

              {!isWidgetActive ? (
                <button onClick={handleInitWidget} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
                  ⚡ Embed OmniGuard Widget
                </button>
              ) : (
                <div style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ height: '10px', width: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                  OmniGuard Invigilator Active
                </div>
              )}
            </div>

            {/* DEMO INTERACTIVE CONTROLS */}
            {isWidgetActive && (
              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', color: '#818cf8' }}>
                  🎮 Host Test Suite Controls (Simulate Live Exam Events)
                </h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button onClick={handleStartExam} className="btn-secondary" style={{ fontSize: '0.8rem' }}>
                    ▶️ Start Exam
                  </button>
                  <button onClick={handleSimulateFaceTurn} className="btn-secondary" style={{ fontSize: '0.8rem', borderColor: '#eab308', color: '#facc15' }}>
                    🔄 Simulate Face Turn (Left)
                  </button>
                  <button onClick={handleSimulateNoise} className="btn-secondary" style={{ fontSize: '0.8rem', borderColor: '#eab308', color: '#facc15' }}>
                    🔊 Simulate Sound Spike (78dB)
                  </button>
                  <button onClick={handleSimulateTabSwitch} className="btn-secondary" style={{ fontSize: '0.8rem', borderColor: '#eab308', color: '#facc15' }}>
                    🖥️ Simulate Tab Switch
                  </button>
                  <button onClick={handleFinishExam} className="btn-primary" style={{ fontSize: '0.8rem' }}>
                    🏁 Finish Exam & Request Report
                  </button>
                </div>
              </div>
            )}

            {/* MOCK EXAM QUESTION */}
            <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '24px' }}>
              <div style={{ color: '#6366f1', fontWeight: 700, marginBottom: '8px' }}>Question 1 of 5 (10 Marks)</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', lineHeight: 1.4 }}>
                Describe how real-time facial landmarks and decibel monitoring prevent exam impersonation and external assistance.
              </h3>
              <textarea
                rows={4}
                placeholder="Type candidate response here..."
                style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                defaultValue="Facial descriptors convert 68 landmarks into a 128-dimensional float array to compute Euclidean distance baseline. Web Audio API measures decibel peaks over 68dB."
              />
            </div>
          </div>

          {/* LIVE HOST CALLBACK LOGS & REPORT PAYLOAD VIEW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Host Callbacks Log */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', color: '#ffffff' }}>
                📡 Live Host Webpage Callbacks ({logs.length})
              </h3>
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                {logs.length === 0 ? (
                  <div style={{ color: '#64748b', padding: '20px', textAlign: 'center' }}>No live flags received yet.</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.04)', borderLeft: '3px solid #f43f5e' }}>
                      <div style={{ fontWeight: 700, color: '#fb7185' }}>{log.eventType} ({log.severity})</div>
                      <div style={{ color: '#cbd5e1' }}>{log.detailsText || log.details}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '4px' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Generated Audit Report Payload */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                  📊 End-of-Exam Audit Report Payload
                </h3>
                {reportData && (
                  <button onClick={handleExportJSON} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                    Export JSON
                  </button>
                )}
              </div>

              {reportData ? (
                <div>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#34d399', fontSize: '0.85rem', marginBottom: '12px' }}>
                    ✓ Report Generated! Trust Score: <strong>{reportData.trustScore}%</strong> | Flags: <strong>{reportData.totalViolations}</strong>
                  </div>
                  <pre style={{ background: '#000000', padding: '12px', borderRadius: '8px', fontSize: '0.75rem', color: '#38bdf8', maxHeight: '180px', overflowY: 'auto' }}>
                    {JSON.stringify(reportData, null, 2)}
                  </pre>
                  <div style={{ marginTop: '12px' }}>
                    <Link href={`/report?id=${reportData.reportId}`} className="btn-primary" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', fontSize: '0.85rem' }}>
                      🔍 View Full Visual Report Page →
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', padding: '40px', textAlign: 'center', fontSize: '0.85rem' }}>
                  Click "Finish Exam" above to generate and inspect the post-exam audit report package.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'code' && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '12px' }}>
            🔌 Copy & Paste Widget Embedding Code
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            Add these lines of HTML/JS to any existing web page or LMS template to enable complete invigilation with camera, microphone, face turning detection, and end-of-exam media reporting.
          </p>

          <pre style={{ background: '#090d16', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#38bdf8', fontSize: '0.85rem', lineHeight: 1.5, overflowX: 'auto' }}>
            {htmlCodeSnippet}
          </pre>
        </div>
      )}
    </div>
  );
}
