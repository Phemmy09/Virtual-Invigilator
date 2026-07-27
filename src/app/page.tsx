import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header Navigation */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
            O
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, background: 'linear-gradient(90deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              OmniGuard AI
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#06b6d4', letterSpacing: '1px', fontWeight: 600 }}>
              INSTITUTIONAL INVIGILATION SUITE
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/student" className="btn-secondary">
            Student Exam Portal
          </Link>
          <Link href="/dashboard" className="btn-primary">
            Teacher Command Center
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="glass-panel" style={{ padding: '60px 40px', textAlign: 'center', marginBottom: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        <div className="badge-status badge-green" style={{ marginBottom: '16px' }}>
          ● Enterprise Grade Security Active
        </div>
        <h2 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '20px', lineHeight: 1.2 }}>
          World-Class AI Invigilator &<br />Multi-Criteria Grading Engine
        </h2>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: '750px', margin: '0 auto 36px auto', lineHeight: 1.6 }}>
          Zero-friction universal integration for universities and high-stakes online exams. Featuring real-time 128-float facial recognition, gaze tracking, Web Audio decibel metering, and OpenAI theory answer grading.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <Link href="/student" className="btn-primary" style={{ padding: '16px 36px', fontSize: '1rem' }}>
            🚀 Launch Student Portal
          </Link>
          <Link href="/dashboard" className="btn-secondary" style={{ padding: '16px 36px', fontSize: '1rem' }}>
            📊 Teacher Dashboard
          </Link>
          <Link href="/demo" className="btn-secondary" style={{ padding: '16px 36px', fontSize: '1rem', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
            ⚡ Embedded SDK Demo
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '60px' }}>
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>👁️</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#ffffff' }}>Multi-Modal Biometrics</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Continuous facial embedding verification, gaze deviation monitoring, head pose tracking, and eye landmark alignment running directly in the browser via `face-api.js`.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🎙️</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#ffffff' }}>Acoustic Anomaly Metering</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Web Audio API decibel metering monitors environmental sound spikes in real-time, logging voice interference and triggering live warnings.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🧠</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#ffffff' }}>OpenAI Theory Grading</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Multi-criteria AI grading evaluating conceptual depth, step-by-step logic, key terminology matching, and originality with fair partial credit allocation.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>📄</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#ffffff' }}>Multi-Format Document Parsing</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Drag and drop PDF, DOCX, CSV, JSON, or TXT files. AI document ingestion automatically extracts questions, answer keys, and theory marking guides.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🛡️</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#ffffff' }}>Browser & Environment Lockdown</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Tab switching detection, DevTools hotkey blocking, clipboard lockdown, IP address logging, and browser geolocation tracking.
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '16px' }}>🔌</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', color: '#ffffff' }}>Universal 1-Line Embed SDK</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Integrates instantly into Canvas, Moodle, Blackboard, or custom exam software with a single script tag and JS configuration object.
          </p>
        </div>
      </div>
    </div>
  );
}
