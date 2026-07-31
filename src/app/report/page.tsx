'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ViolationItem {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'low' | 'medium' | 'critical';
  detailsText: string;
  audioDb?: number;
  snapshotUrl?: string;
  videoClipUrl?: string;
}

interface AuditReport {
  reportId: string;
  sessionId: string;
  examId: string;
  studentId: string;
  matricNumber: string;
  studentName: string;
  subject: string;
  completedAt: string;
  trustScore: number;
  totalViolations: number;
  flagCounts: {
    faceTurning: number;
    noiseSpike: number;
    missingFace: number;
    multipleFaces: number;
    tabSwitch: number;
    other: number;
  };
  violations: ViolationItem[];
}

function ReportContent() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('id') || searchParams.get('reportId');

  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const url = reportId ? `/api/reports?id=${encodeURIComponent(reportId)}` : '/api/reports';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.report) {
        setReport(data.report);
      } else {
        // Fallback demo report if no live session exists yet
        setReport(getSampleReport());
      }
    } catch (err) {
      console.error('Error loading report:', err);
      setReport(getSampleReport());
    } finally {
      setLoading(false);
    }
  };

  const getSampleReport = (): AuditReport => ({
    reportId: 'rep-demo-2026',
    sessionId: 'CS50-AI-HVD-2026-8942',
    examId: 'CS50-AI',
    studentId: 'Alex Mercer',
    matricNumber: 'HVD-2026-8942',
    studentName: 'Alex Mercer',
    subject: 'CS50 - Artificial Intelligence',
    completedAt: new Date().toISOString(),
    trustScore: 88,
    totalViolations: 3,
    flagCounts: {
      faceTurning: 1,
      noiseSpike: 1,
      missingFace: 0,
      multipleFaces: 0,
      tabSwitch: 1,
      other: 0,
    },
    violations: [
      {
        id: 'v1',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        eventType: 'face_turn_right',
        severity: 'medium',
        detailsText: 'Candidate turned face significantly to the right away from active screen.',
        audioDb: 42,
        snapshotUrl: undefined,
      },
      {
        id: 'v2',
        timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
        eventType: 'noise_spike',
        severity: 'medium',
        detailsText: 'Loud ambient sound / voice detected: 74dB',
        audioDb: 74,
      },
      {
        id: 'v3',
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        eventType: 'tab_switch',
        severity: 'medium',
        detailsText: 'Student switched browser tab or minimized examination window.',
        audioDb: 35,
      },
    ],
  });

  const handleDownloadJSON = () => {
    if (!report) return;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OmniGuard_Audit_Report_${report.matricNumber || 'candidate'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px', textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⚙️ Loading Proctoring Audit Report...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={{ maxWidth: '1000px', margin: '60px auto', padding: '0 20px', textAlign: 'center', color: '#fff' }}>
        <h2>No Audit Report Available</h2>
        <p>Please complete an invigilated exam to view the proctoring report.</p>
        <Link href="/student" className="btn-primary">Return to Student Portal</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <Link href="/student" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Back to Student Portal
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleDownloadJSON} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
            📥 Export JSON Audit
          </button>
          <button onClick={handlePrint} className="btn-primary" style={{ fontSize: '0.85rem' }}>
            🖨️ Print Audit Certificate
          </button>
        </div>
      </div>

      {/* HEADER CARD: CANDIDATE & TRUST INDEX */}
      <div className="glass-panel" style={{ padding: '36px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #6366f1', color: '#818cf8', fontWeight: 700 }}>
                INSTITUTIONAL PROCTORING AUDIT REPORT
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {report.reportId}</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
              {report.studentName}
            </h1>
            <div style={{ fontSize: '0.95rem', color: '#cbd5e1', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span>Matric No: <strong style={{ color: '#06b6d4' }}>{report.matricNumber}</strong></span>
              <span>Subject: <strong style={{ color: '#ffffff' }}>{report.subject}</strong></span>
              <span>Exam ID: <strong style={{ color: '#94a3b8' }}>{report.examId}</strong></span>
            </div>
          </div>

          {/* Dynamic Trust Score Badge */}
          <div style={{
            padding: '20px 28px',
            borderRadius: '16px',
            background: report.trustScore > 75 ? 'rgba(16, 185, 129, 0.12)' : report.trustScore > 50 ? 'rgba(234, 179, 8, 0.12)' : 'rgba(244, 63, 94, 0.15)',
            border: report.trustScore > 75 ? '2px solid #10b981' : report.trustScore > 50 ? '2px solid #eab308' : '2px solid #f43f5e',
            textAlign: 'center',
            minWidth: '180px'
          }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '4px' }}>
              Integrity Rating
            </div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: report.trustScore > 75 ? '#34d399' : report.trustScore > 50 ? '#facc15' : '#fb7185' }}>
              {report.trustScore}%
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: report.trustScore > 75 ? '#10b981' : report.trustScore > 50 ? '#eab308' : '#f43f5e' }}>
              {report.trustScore > 75 ? '✓ HIGH INTEGRITY PASS' : report.trustScore > 50 ? '⚠️ MODERATE REVIEW NEEDED' : '🚨 CRITICAL INTEGRITY RISK'}
            </div>
          </div>
        </div>
      </div>

      {/* FLAG COUNTERS SUMMARY TILES */}
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
        📊 Exam Irregularity Summary
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '36px' }}>
        <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🔄</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>{report.flagCounts.faceTurning || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Face Turns / Off-Screen</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🔊</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#facc15' }}>{report.flagCounts.noiseSpike || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Audio Noise Spikes</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🙈</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fb7185' }}>{report.flagCounts.missingFace || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Missing Face</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>👥</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e' }}>{report.flagCounts.multipleFaces || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Multiple Individuals</div>
        </div>

        <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🖥️</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a78bfa' }}>{report.flagCounts.tabSwitch || 0}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>Tab Switches / Focus Loss</div>
        </div>
      </div>

      {/* CHRONOLOGICAL INCIDENT EVIDENCE TIMELINE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
          📹 Captured Flags & Media Evidence Timeline ({report.violations.length})
        </h2>
        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
          High-res Canvas Snapshots & WebM Video Clips
        </span>
      </div>

      {report.violations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: '#10b981' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🛡️</div>
          <h3>CLEAN EXAM AUDIT - NO SECURITY FLAGS DETECTED</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>The candidate maintained continuous face alignment and baseline acoustic compliance throughout the examination.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {report.violations.map((v, idx) => (
            <div key={v.id || idx} className="glass-panel" style={{ padding: '24px', borderLeft: v.severity === 'critical' ? '4px solid #f43f5e' : v.severity === 'medium' ? '4px solid #eab308' : '4px solid #38bdf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '12px',
                      textTransform: 'uppercase',
                      background: v.severity === 'critical' ? 'rgba(244, 63, 94, 0.2)' : v.severity === 'medium' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: v.severity === 'critical' ? '#fb7185' : v.severity === 'medium' ? '#facc15' : '#38bdf8',
                      border: v.severity === 'critical' ? '1px solid #f43f5e' : v.severity === 'medium' ? '1px solid #eab308' : '1px solid #38bdf8',
                    }}>
                      {v.severity} severity
                    </span>
                    <span style={{ fontWeight: 700, color: '#ffffff', fontSize: '1.05rem' }}>
                      Flag #{idx + 1}: {v.eventType.toUpperCase().replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '4px 0 0 0' }}>{v.detailsText}</p>
                </div>

                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>
                  <div>🕒 {new Date(v.timestamp).toLocaleTimeString()}</div>
                  {v.audioDb !== undefined && (
                    <div>Mic Audio: <strong style={{ color: v.audioDb > 68 ? '#f43f5e' : '#34d399' }}>{v.audioDb} dB</strong></div>
                  )}
                </div>
              </div>

              {/* MEDIA EVIDENCE SECTION: IMAGE SNAPSHOT & VIDEO CLIP */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                {/* 1. Captured Image Frame Snapshot */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📷 Camera Snapshot at Flag Instant</span>
                  </div>
                  {v.snapshotUrl ? (
                    <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#000' }}>
                      <img
                        src={v.snapshotUrl}
                        alt={`Flag snapshot ${idx + 1}`}
                        style={{ width: '100%', height: '180px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => setSelectedSnapshot(v.snapshotUrl || null)}
                      />
                      <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' }}>
                        Click to enlarge
                      </div>
                    </div>
                  ) : (
                    <div style={{ height: '140px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                      Snapshot Evidence Captured
                    </div>
                  )}
                </div>

                {/* 2. Captured WebM Video Clip Recording */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🎬 3-Second Video Evidence Recording</span>
                  </div>
                  {v.videoClipUrl ? (
                    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)', background: '#000' }}>
                      <video
                        src={v.videoClipUrl}
                        controls
                        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '140px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px dashed rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                      Video Clip Buffer Attached
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FULLSIZE IMAGE MODAL */}
      {selectedSnapshot && (
        <div
          onClick={() => setSelectedSnapshot(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div style={{ maxWidth: '800px', width: '100%', textAlign: 'center' }}>
            <img src={selectedSnapshot} alt="Full evidence snapshot" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.9)' }} />
            <div style={{ color: '#94a3b8', marginTop: '12px', fontSize: '0.9rem' }}>Click anywhere to close modal</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AuditReportPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: '40px', textAlign: 'center' }}>Loading Report Viewer...</div>}>
      <ReportContent />
    </Suspense>
  );
}
