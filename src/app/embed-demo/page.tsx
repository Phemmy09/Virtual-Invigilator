'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    OmniGuard: any;
    OmniGuardProctor: any;
    OmniGuardFaceId: any;
  }
}

export default function EmbedDemoPage() {
  const [activeWidgetTab, setActiveWidgetTab] = useState<'proctor' | 'faceid'>('proctor');
  const [viewMode, setViewMode] = useState<'demo' | 'code'>('demo');

  const [isProctorActive, setIsProctorActive] = useState<boolean>(false);
  const [isFaceIdActive, setIsFaceIdActive] = useState<boolean>(false);

  const [proctorLogs, setProctorLogs] = useState<any[]>([]);
  const [faceIdLogs, setFaceIdLogs] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any | null>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/sdk/omniguard-sdk.js';
    script.async = true;
    script.onload = () => {
      console.log('OmniGuard Universal SDK loaded.');
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

  // Initialize Proctor Widget
  const handleInitProctorWidget = () => {
    if (window.OmniGuardProctor || window.OmniGuard) {
      const sdk = window.OmniGuardProctor || window.OmniGuard.Proctor;
      sdk.init({
        serverUrl: window.location.origin,
        candidateId: 'a5c69632941a4c99ad0d028e64eac468',
        examId: '568',
        tenantCode: 'MASTER',
        domain: 'AI_TESTING',
        event: 'AI_FLAG',
        studentName: 'Alex Mercer',
        subject: 'CS50 - Artificial Intelligence',
        strictLockdown: true,
        widgetPosition: 'bottom-right',
        onFlag: (flag: any) => {
          console.log('[Host Webpage Callback] Proctor Flag captured:', flag);
          setProctorLogs((prev) => [flag, ...prev]);
        },
        onReport: (report: any) => {
          console.log('[Host Webpage Callback] Audit Report received:', report);
          setReportData(report);
        },
      });
      setIsProctorActive(true);
    } else {
      alert('OmniGuard SDK not loaded yet.');
    }
  };

  // Initialize Face Identification Widget
  const handleInitFaceIdWidget = () => {
    if (window.OmniGuardFaceId || window.OmniGuard) {
      const sdk = window.OmniGuardFaceId || window.OmniGuard.FaceId;
      sdk.init({
        serverUrl: window.location.origin,
        candidateId: 'a5c69632941a4c99ad0d028e64eac468',
        examId: '568',
        tenantCode: 'MASTER',
        domain: 'AI_TESTING',
        event: 'AI_FLAG',
        candidateName: 'Alex Mercer',
        widgetPosition: 'bottom-left',
        onVerified: (res: any) => {
          console.log('[Host Webpage Callback] Face ID Verified:', res);
          setFaceIdLogs((prev) => [{ type: 'FACE_VERIFIED', detailsText: `Biometric score: ${res.matchScore}%`, timestamp: new Date().toISOString() }, ...prev]);
        },
        onFlag: (flag: any) => {
          console.log('[Host Webpage Callback] Face ID Flag:', flag);
          setFaceIdLogs((prev) => [flag, ...prev]);
        },
      });
      setIsFaceIdActive(true);
    } else {
      alert('OmniGuard SDK not loaded yet.');
    }
  };

  // Event Code Simulations
  const triggerSimulatedFlag = (eventCode: string, description: string, severity: string = 'medium') => {
    if (window.OmniGuardProctor) {
      window.OmniGuardProctor.reportViolation(eventCode, severity, `SIMULATION: ${description}`);
    } else if (window.OmniGuard) {
      window.OmniGuard.reportViolation(eventCode, severity, `SIMULATION: ${description}`);
    }
  };

  const handleFinishExam = () => {
    if (window.OmniGuardProctor) {
      window.OmniGuardProctor.finishExam((report: any) => {
        setReportData(report);
      });
    } else if (window.OmniGuard) {
      window.OmniGuard.finishExam((report: any) => {
        setReportData(report);
      });
    }
  };

  const proctorEmbedCode = `<!-- 1. Include OmniGuard Proctor Widget SDK -->
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/sdk/omniguard-proctor.js"></script>

<!-- 2. Initialize Proctor Widget with Webhook Flagging -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    OmniGuardProctor.init({
      serverUrl: '${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}',
      candidateId: 'a5c69632941a4c99ad0d028e64eac468',
      examId: '568',
      tenantCode: 'MASTER',
      domain: 'AI_TESTING',
      event: 'AI_FLAG',
      studentName: 'Alex Mercer',
      subject: 'CS50 - Artificial Intelligence',
      widgetPosition: 'bottom-right',
      strictLockdown: true,
      
      // Live event flag callback (dispatched automatically to Azure Webhook)
      onFlag: function (flag) {
        console.log('Live Proctor Event Flag:', flag.eventType, flag);
      },
      
      // End of exam audit report callback
      onReport: function (report) {
        console.log('Exam Report Payload:', report);
      }
    });
  });
</script>`;

  const faceIdEmbedCode = `<!-- 1. Include OmniGuard Face Identification Widget SDK -->
<script src="${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/sdk/omniguard-faceid.js"></script>

<!-- 2. Initialize Face ID Widget -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    OmniGuardFaceId.init({
      serverUrl: '${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}',
      candidateId: 'a5c69632941a4c99ad0d028e64eac468',
      examId: '568',
      tenantCode: 'MASTER',
      domain: 'AI_TESTING',
      event: 'AI_FLAG',
      candidateName: 'Alex Mercer',
      widgetPosition: 'bottom-left',
      
      // Verification success callback
      onVerified: function (result) {
        console.log('Candidate Biometrically Verified:', result);
      },
      
      // Webhook flag callback if face mismatch/absence occurs
      onFlag: function (flag) {
        console.warn('Face ID Flag:', flag);
      }
    });
  });
</script>`;

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Top Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <Link href="/" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Back to Home
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setViewMode('demo')}
            className={viewMode === 'demo' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.85rem' }}
          >
            💻 Live Embed Showcase
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={viewMode === 'code' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.85rem' }}
          >
            📜 Widget Integration Snippets
          </button>
          <Link href="/report" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            📊 Sample Audit Report
          </Link>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: '#06b6d4',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '10px'
        }}>
          UNIVERSAL EMBEDDABLE WIDGET SUITE
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
          Proctor & Face Identification Embeddable Widgets
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '720px', margin: '0 auto' }}>
          Embed real-time invigilation, biometric face verification, and automatic Azure Webhook flagging into any external web platform or LMS.
        </p>
      </div>

      {/* Widget Tabs Selector */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
        <button
          onClick={() => setActiveWidgetTab('proctor')}
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            background: activeWidgetTab === 'proctor' ? 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.05)',
            border: activeWidgetTab === 'proctor' ? '1px solid #818cf8' : '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: activeWidgetTab === 'proctor' ? '0 4px 20px rgba(99, 102, 241, 0.4)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          📹 1. Proctor Widget
        </button>

        <button
          onClick={() => setActiveWidgetTab('faceid')}
          style={{
            padding: '12px 28px',
            borderRadius: '12px',
            background: activeWidgetTab === 'faceid' ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' : 'rgba(255, 255, 255, 0.05)',
            border: activeWidgetTab === 'faceid' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            boxShadow: activeWidgetTab === 'faceid' ? '0 4px 20px rgba(6, 182, 212, 0.4)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          👤 2. Face Identification Widget
        </button>
      </div>

      {viewMode === 'demo' && (
        <div>
          {/* SIMULATED THIRD PARTY UNIVERSITY WEBSITE */}
          <div className="glass-panel" style={{ padding: '36px', marginBottom: '32px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <span className="badge-status badge-green" style={{ marginBottom: '6px', display: 'inline-block' }}>
                  🎓 HARVARD LMS - EMBEDDED INTEGRATION
                </span>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>
                  CS50: Introduction to Artificial Intelligence - Midterm
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Candidate ID: <strong>a5c69632941a4c99ad0d028e64eac468</strong> | Exam ID: <strong>568</strong> | Tenant: <strong>MASTER</strong>
                </p>
              </div>

              {activeWidgetTab === 'proctor' ? (
                !isProctorActive ? (
                  <button onClick={handleInitProctorWidget} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem' }}>
                    ⚡ Embed Proctor Widget
                  </button>
                ) : (
                  <div style={{ color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ height: '10px', width: '10px', borderRadius: '50%', background: '#10b981' }}></span>
                    Proctor Widget Active (Bottom-Right)
                  </div>
                )
              ) : (
                !isFaceIdActive ? (
                  <button onClick={handleInitFaceIdWidget} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.95rem', background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' }}>
                    ⚡ Embed Face ID Widget
                  </button>
                ) : (
                  <div style={{ color: '#06b6d4', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ height: '10px', width: '10px', borderRadius: '50%', background: '#06b6d4' }}></span>
                    Face ID Widget Active (Bottom-Left)
                  </div>
                )
              )}
            </div>

            {/* 8 PENALIZABLE PROCTOR EVENT SIMULATION BAR */}
            {activeWidgetTab === 'proctor' && isProctorActive && (
              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#818cf8' }}>
                    🎮 Test & Trigger 8 Penalizable Proctor Events (POST Webhook to Azure)
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Target: https://examportalv2apitest.azurewebsites.net/api/v1/Proctor/flag</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                  <button onClick={() => triggerSimulatedFlag('FULLSCREEN_CHANGE', 'Full screen state changed to windowed', 'medium')} className="btn-secondary" style={{ fontSize: '0.78rem', borderColor: '#eab308', color: '#facc15' }}>
                    🖥️ FULLSCREEN_CHANGE
                  </button>
                  <button onClick={() => triggerSimulatedFlag('TAB_FOCUS_CHANGE', 'Tab focus state switched', 'low')} className="btn-secondary" style={{ fontSize: '0.78rem', borderColor: '#eab308', color: '#facc15' }}>
                    📑 TAB_FOCUS_CHANGE
                  </button>
                  <button onClick={() => triggerSimulatedFlag('EXIT_FULLSCREEN', 'Student exited full screen mode', 'critical')} className="btn-secondary" style={{ fontSize: '0.78rem', borderColor: '#f43f5e', color: '#fb7185' }}>
                    🚨 EXIT_FULLSCREEN
                  </button>
                  <button onClick={() => triggerSimulatedFlag('FACE_ABSENCE', 'Candidate face out of view', 'medium')} className="btn-secondary" style={{ fontSize: '0.78rem', borderColor: '#eab308', color: '#facc15' }}>
                    👤 FACE_ABSENCE
                  </button>
                  <button onClick={() => triggerSimulatedFlag('MULTIPLE_FACE', 'Multiple individuals in webcam frame', 'critical')} className="btn-secondary" style={{ fontSize: '0.78rem', borderColor: '#f43f5e', color: '#fb7185' }}>
                    👥 MULTIPLE_FACE
                  </button>
                  <button onClick={() => triggerSimulatedFlag('SOUND_DETECTED', 'Loud voice / noise spike detected (75dB)', 'medium')} className="btn-secondary" style={{ fontSize: '0.78rem', borderColor: '#eab308', color: '#facc15' }}>
                    🔊 SOUND_DETECTED
                  </button>
                  <button onClick={() => triggerSimulatedFlag('TAB_NOT_FOCUS', 'Window out of focus or minimized', 'medium')} className="btn-secondary" style={{ fontSize: '0.78rem', borderColor: '#eab308', color: '#facc15' }}>
                    📵 TAB_NOT_FOCUS
                  </button>
                  <button onClick={() => triggerSimulatedFlag('SUSPICIOUS_ACTIVITY', 'Head turn / devtools / context menu', 'critical')} className="btn-secondary" style={{ fontSize: '0.78rem', borderColor: '#f43f5e', color: '#fb7185' }}>
                    ⚠️ SUSPICIOUS_ACTIVITY
                  </button>
                </div>

                <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={handleFinishExam} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                    🏁 Finish Exam & Generate Audit Report
                  </button>
                </div>
              </div>
            )}

            {/* MOCK EXAM QUESTION */}
            <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '24px' }}>
              <div style={{ color: '#6366f1', fontWeight: 700, marginBottom: '8px', fontSize: '0.85rem' }}>Question 1 of 5 (10 Marks)</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', lineHeight: 1.4 }}>
                Explain how embeddable widgets process real-time biometric landmarks and decibel levels to send JSON flags to external webhooks.
              </h3>
              <textarea
                rows={4}
                placeholder="Type response..."
                style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.9rem' }}
                defaultValue="The embeddable proctor widget captures media snapshot/video evidence and dispatches HTTP POST requests with TenantCode: MASTER and JSON body containing flagId, candidateId, examId, type, domain, and mediaUrl."
              />
            </div>
          </div>

          {/* TELEMETRY & WEBHOOK AUDIT LOGS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Live Flag Log */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', color: '#ffffff' }}>
                📡 Live Webhook Flags & Telemetry Log ({activeWidgetTab === 'proctor' ? proctorLogs.length : faceIdLogs.length})
              </h3>
              <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                {(activeWidgetTab === 'proctor' ? proctorLogs : faceIdLogs).length === 0 ? (
                  <div style={{ color: '#64748b', padding: '20px', textAlign: 'center' }}>No event flags captured yet. Trigger an action above.</div>
                ) : (
                  (activeWidgetTab === 'proctor' ? proctorLogs : faceIdLogs).map((log, i) => (
                    <div key={i} style={{ padding: '10px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.04)', borderLeft: '3px solid #f43f5e' }}>
                      <div style={{ fontWeight: 700, color: '#fb7185' }}>{log.type || log.eventType}</div>
                      <div style={{ color: '#cbd5e1' }}>{log.description || log.detailsText}</div>
                      <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '4px' }}>
                        Candidate: {log.candidateId || 'a5c69632941a4c99ad0d028e64eac468'} | Sent to Webhook
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Generated Audit Report */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
                📊 End-of-Exam Audit Report Package
              </h3>

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
                      🔍 View Detailed Visual Report Page →
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#64748b', padding: '40px', textAlign: 'center', fontSize: '0.85rem' }}>
                  Click "Finish Exam" above to generate and inspect the post-exam audit report payload.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'code' && (
        <div className="glass-panel" style={{ padding: '36px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '16px' }}>
            🔌 Embeddable Code Snippets for Any Website
          </h2>

          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#818cf8', marginBottom: '8px' }}>
              Option A: Proctor Widget Embedding Code
            </h3>
            <pre style={{ background: '#090d16', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#38bdf8', fontSize: '0.82rem', lineHeight: 1.5, overflowX: 'auto' }}>
              {proctorEmbedCode}
            </pre>
          </div>

          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#06b6d4', marginBottom: '8px' }}>
              Option B: Face Identification Widget Embedding Code
            </h3>
            <pre style={{ background: '#090d16', padding: '20px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#38bdf8', fontSize: '0.82rem', lineHeight: 1.5, overflowX: 'auto' }}>
              {faceIdEmbedCode}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
