'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const universalSdkSnippet = `<!-- 1. Include OmniGuard Universal SDK -->
<script src="https://virtual-invigilator.vercel.app/sdk/omniguard-sdk.js"></script>

<!-- 2. Initialize Proctor Widget -->
<script>
  document.addEventListener('DOMContentLoaded', function () {
    OmniGuard.init({
      serverUrl: 'https://virtual-invigilator.vercel.app',
      candidateId: 'a5c69632941a4c99ad0d028e64eac468',
      examId: '568',
      tenantCode: 'MASTER',
      domain: 'AI_TESTING',
      event: 'AI_FLAG',
      studentName: 'Alex Mercer',
      subject: 'CS50 - Artificial Intelligence',
      widgetPosition: 'bottom-right',
      strictLockdown: true,
      
      // Live security violation callback
      onFlag: function (flag) {
        console.log('Security violation detected:', flag.eventType, flag);
      },
      
      // Post-exam audit report callback
      onReport: function (report) {
        console.log('Final Exam Audit Report:', report);
      }
    });
  });
</script>`;

  const proctorSdkSnippet = `<!-- Standalone Proctor Widget SDK -->
<script src="https://virtual-invigilator.vercel.app/sdk/omniguard-proctor.js"></script>

<script>
  OmniGuardProctor.init({
    serverUrl: 'https://virtual-invigilator.vercel.app',
    candidateId: 'a5c69632941a4c99ad0d028e64eac468',
    examId: '568',
    tenantCode: 'MASTER',
    domain: 'AI_TESTING',
    event: 'AI_FLAG',
    widgetPosition: 'bottom-right',
    strictLockdown: true,
    onFlag: function (flag) {
      console.warn('Proctor Flag:', flag.eventType, flag);
    }
  });

  function finishExam() {
    OmniGuardProctor.finishExam(function (report) {
      console.log('Post-Exam Audit Report:', report);
    });
  }
</script>`;

  const faceIdSdkSnippet = `<!-- Standalone Face Identification Widget SDK -->
<script src="https://virtual-invigilator.vercel.app/sdk/omniguard-faceid.js"></script>

<script>
  OmniGuardFaceId.init({
    serverUrl: 'https://virtual-invigilator.vercel.app',
    candidateId: 'a5c69632941a4c99ad0d028e64eac468',
    examId: '568',
    tenantCode: 'MASTER',
    candidateName: 'Alex Mercer',
    widgetPosition: 'bottom-left',
    onVerified: function (result) {
      console.log('Biometric Verification Score:', result.matchScore + '%');
    },
    onFlag: function (flag) {
      console.warn('Face ID Mismatch Flag:', flag);
    }
  });
</script>`;

  const webhookPayloadSnippet = `{
  "flagId": "flag_1722880000000_abc12",
  "candidateId": "a5c69632941a4c99ad0d028e64eac468",
  "examId": "568",
  "type": "SUSPICIOUS_ACTIVITY",
  "domain": "AI_TESTING",
  "mediaUrl": "data:image/jpeg;base64,...",
  "description": "Candidate turned face significantly to the right",
  "event": "AI_FLAG"
}`;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px', color: '#f8fafc' }}>
      {/* Top Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>
              O
            </div>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800, background: 'linear-gradient(90deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                OmniGuard AI
              </h1>
              <p style={{ fontSize: '0.7rem', color: '#06b6d4', letterSpacing: '1px', fontWeight: 600 }}>
                DOCUMENTATION & INTEGRATION MANUAL
              </p>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <Link href="/embed-demo" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem', borderColor: 'rgba(6, 182, 212, 0.4)', color: '#38bdf8' }}>
            🔌 Live Embed Demo
          </Link>
          <Link href="/enroll" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            ➕ Candidate Enrollment
          </Link>
          <Link href="/student" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            ✍️ Student Exam Portal
          </Link>
          <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.85rem' }}>
            🏫 Teacher Command Center
          </Link>
        </div>
      </nav>

      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '40px', marginBottom: '36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%' }}></div>
        <div className="badge-status badge-green" style={{ marginBottom: '12px' }}>
          ● Comprehensive Developer & Architecture Guide
        </div>
        <h2 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '12px', background: 'linear-gradient(90deg, #ffffff, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          OmniGuard AI System Documentation
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: '820px', lineHeight: 1.6 }}>
          Complete technical specifications, biometrics architecture, OpenAI gpt-4o theory answer grading rubrics, REST API endpoints, and 1-line SDK embedding guides for Canvas, Blackboard, Moodle, and custom exam platforms.
        </p>
      </div>

      {/* Main Grid: Sidebar + Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Sticky Sidebar Navigation */}
        <div className="glass-panel" style={{ padding: '20px', position: 'sticky', top: '20px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '16px', paddingLeft: '8px' }}>
            DOCUMENTATION SECTIONS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'overview', label: '🚀 1. Overview & System Architecture' },
              { id: 'biometrics', label: '👁️ 2. Biometric Facial Recognition' },
              { id: 'proctoring', label: '📹 3. Invigilation & Decibel Metering' },
              { id: 'grading', label: '🧠 4. OpenAI Theory Grading Engine' },
              { id: 'parsing', label: '📄 5. Multi-Format Document Ingestion' },
              { id: 'sdk', label: '🔌 6. Universal SDK Embedding Guide' },
              { id: 'webhooks', label: '📡 7. Azure Webhook Flag Telemetry' },
              { id: 'api', label: '⚙️ 8. REST API Reference' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  const el = document.getElementById(item.id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: activeSection === item.id ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: activeSection === item.id ? '1px solid #6366f1' : 'none',
                  color: activeSection === item.id ? '#ffffff' : '#94a3b8',
                  fontWeight: activeSection === item.id ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documentation Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          
          {/* SECTION 1: OVERVIEW */}
          <section id="overview" className="glass-panel" style={{ padding: '36px' }}>
            <div className="badge-status badge-green" style={{ marginBottom: '12px' }}>CHAPTER 1</div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
              🚀 System Overview & Architecture
            </h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
              <strong>OmniGuard AI</strong> is an enterprise-grade, zero-friction invigilation and AI evaluation platform built for high-stakes online examinations, universities, and certification providers. The system operates entirely in-browser without requiring candidate software installations or invasive desktop agents.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '24px' }}>
              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👤 Candidate Enrollment</div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Records student credentials (First/Last Name, Student ID, Email, Phone, DOB, Age) and extracts a 128-float facial vector profile via webcam.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📹 Real-Time Invigilation</div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Monitors facial descriptors, gaze deviations, eye landmark alignment, Web Audio API decibel metering, tab switches, and DevTools attempts.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🧠 Multi-Criteria AI Grading</div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Evaluates subjective theory responses using OpenAI gpt-4o for conceptual accuracy, step-by-step correctness, terminology match, and fair partial credit.
                </p>
              </div>

              <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔌 Universal 1-Line SDK</div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Embeds floating Proctor and Face Identification widgets into Canvas, Moodle, Blackboard, or custom LMS platforms with live Azure Webhook relay.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 2: BIOMETRIC FACIAL RECOGNITION */}
          <section id="biometrics" className="glass-panel" style={{ padding: '36px' }}>
            <div className="badge-status badge-green" style={{ marginBottom: '12px' }}>CHAPTER 2</div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
              👁️ Biometric Facial Vector Matching
            </h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
              Biometric facial recognition is driven by client-side neural networks running in <code>face-api.js</code> (built on TensorFlow.js). The model analyzes 68 facial landmarks to convert facial features into a 128-dimensional floating-point vector descriptor.
            </p>

            <div style={{ background: '#090d16', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '1rem', color: '#38bdf8', marginBottom: '10px' }}>Euclidean Distance Formula</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Identity verification compares the live facial descriptor vector v_live against the enrolled reference descriptor v_ref using <strong>Euclidean distance</strong>:
              </p>
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.6)', borderRadius: '8px', color: '#34d399', fontFamily: 'monospace', fontSize: '0.95rem', margin: '12px 0' }}>
                d(v_live, v_ref) = &radic;(&sum; (v_live[i] - v_ref[i])&sup2;)
              </div>
              <ul style={{ color: '#cbd5e1', fontSize: '0.85rem', paddingLeft: '20px', lineHeight: 1.6 }}>
                <li><strong>Distance &lt; 0.55</strong>: ✅ High-confidence Identity Match (Match Score &gt; 90%).</li>
                <li><strong>Distance 0.55 – 0.65</strong>: ⚠️ Warning Threshold / Secondary Biometric Check.</li>
                <li><strong>Distance &gt; 0.65</strong>: 🚨 Face Mismatch / Automatic Access Denial & Security Flag.</li>
              </ul>
            </div>
          </section>

          {/* SECTION 3: INVASION-FREE PROCTORING & AUDIO METERING */}
          <section id="proctoring" className="glass-panel" style={{ padding: '36px' }}>
            <div className="badge-status badge-green" style={{ marginBottom: '12px' }}>CHAPTER 3</div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
              📹 Real-Time Invigilation & Web Audio Decibel Metering
            </h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
              The OmniGuard Proctor Engine runs continuous multi-modal background monitoring during active exam sessions:
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#06b6d4', fontSize: '0.85rem' }}>
                  <th style={{ padding: '10px' }}>Security Sensor</th>
                  <th style={{ padding: '10px' }}>Detection Mechanism</th>
                  <th style={{ padding: '10px' }}>Threshold & Penalty</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.88rem', color: '#cbd5e1' }}>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>Face Presence</td>
                  <td style={{ padding: '12px' }}>TinyFaceDetector neural net scanning webcam feed every 2.5s</td>
                  <td style={{ padding: '12px', color: '#fb7185' }}>0 faces: FACE_ABSENCE (-15 pts)<br/>&gt;1 face: MULTIPLE_FACE (-15 pts)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>Head Pose & Gaze</td>
                  <td style={{ padding: '12px' }}>68 landmark eye/nose alignment ratio & pitch delta</td>
                  <td style={{ padding: '12px', color: '#facc15' }}>Yaw &lt;0.35 or &gt;2.8: Head turn (-8 pts)<br/>Pitch diff off-baseline: Gaze deviation (-3 pts)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>Acoustic Metering</td>
                  <td style={{ padding: '12px' }}>Web Audio API 512-fft frequency bin analysis of microphone stream</td>
                  <td style={{ padding: '12px', color: '#facc15' }}>Ambient noise spike &gt;68dB: SOUND_DETECTED (-8 pts)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 700 }}>Browser Lockdown</td>
                  <td style={{ padding: '12px' }}>HTML5 Page Visibility API, window blur, fullscreen change, contextmenu, F12 hotkeys</td>
                  <td style={{ padding: '12px', color: '#fb7185' }}>Tab switch: TAB_NOT_FOCUS (-8 pts)<br/>Exit Fullscreen: EXIT_FULLSCREEN (-15 pts)</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* SECTION 4: OPENAI THEORY GRADING ENGINE */}
          <section id="grading" className="glass-panel" style={{ padding: '36px' }}>
            <div className="badge-status badge-green" style={{ marginBottom: '12px' }}>CHAPTER 4</div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
              🧠 OpenAI Multi-Criteria Theory Answer Evaluation
            </h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
              Subjective essay and theory questions are evaluated through OpenAI's <code>gpt-4o</code> API using structured JSON output. Rather than simple string matching, the AI parses answers across four key dimensions:
            </p>

            <div style={{ background: '#090d16', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#818cf8', marginBottom: '10px' }}>Multi-Criteria Evaluation Rubric</h4>
              <ol style={{ color: '#cbd5e1', fontSize: '0.88rem', paddingLeft: '20px', lineHeight: 1.7 }}>
                <li><strong>Conceptual Accuracy (40% Weight)</strong>: Assesses structural logic, core thesis correctness, and theoretical validity.</li>
                <li><strong>Process Step Correctness (30% Weight)</strong>: Evaluates step-by-step working, methodological progression, and partial credit logic.</li>
                <li><strong>Key Terminology Match (15% Weight)</strong>: Detects required domain keywords and identifies missing terminology.</li>
                <li><strong>Originality & Authenticity (15% Weight)</strong>: Analyzes response patterns for automated generation or copy-paste artifacts.</li>
              </ol>
            </div>
          </section>

          {/* SECTION 5: MULTI-FORMAT DOCUMENT INGESTION */}
          <section id="parsing" className="glass-panel" style={{ padding: '36px' }}>
            <div className="badge-status badge-green" style={{ marginBottom: '12px' }}>CHAPTER 5</div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
              📄 Multi-Format AI Document Ingestion
            </h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
              Educators can upload raw exam documents in <strong>PDF</strong> (via <code>pdf-parse</code>), <strong>DOCX/DOC</strong> (via <code>mammoth</code>), <strong>CSV</strong>, <strong>JSON</strong>, or <strong>TXT</strong> format. The document ingestion pipeline extracts questions, multiple-choice options, correct answers, and marking rubrics automatically.
            </p>
          </section>

          {/* SECTION 6: UNIVERSAL SDK EMBEDDING GUIDE */}
          <section id="sdk" className="glass-panel" style={{ padding: '36px' }}>
            <div className="badge-status badge-green" style={{ marginBottom: '12px' }}>CHAPTER 6</div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
              🔌 Universal SDK Embedding Guide
            </h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '24px', fontSize: '0.95rem' }}>
              Integrate live invigilation and face identification into any external LMS or web application in minutes with our lightweight JavaScript SDK files hosted in <code>/sdk/</code>.
            </p>

            {/* Snippet 1 */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>Option A: Universal Combined SDK (Proctor + Face ID)</h4>
                <button onClick={() => copyToClipboard(universalSdkSnippet, 's1')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  {copiedSnippet === 's1' ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>
              <pre style={{ background: '#090d16', padding: '16px', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#38bdf8', fontSize: '0.8rem', overflowX: 'auto', lineHeight: 1.4 }}>
                {universalSdkSnippet}
              </pre>
            </div>

            {/* Snippet 2 */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#818cf8' }}>Option B: Standalone Proctor Widget (`omniguard-proctor.js`)</h4>
                <button onClick={() => copyToClipboard(proctorSdkSnippet, 's2')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  {copiedSnippet === 's2' ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>
              <pre style={{ background: '#090d16', padding: '16px', borderRadius: '10px', border: '1px solid rgba(99, 102, 241, 0.3)', color: '#38bdf8', fontSize: '0.8rem', overflowX: 'auto', lineHeight: 1.4 }}>
                {proctorSdkSnippet}
              </pre>
            </div>

            {/* Snippet 3 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#06b6d4' }}>Option C: Standalone Face Identification Widget (`omniguard-faceid.js`)</h4>
                <button onClick={() => copyToClipboard(faceIdSdkSnippet, 's3')} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  {copiedSnippet === 's3' ? '✓ Copied!' : '📋 Copy Code'}
                </button>
              </div>
              <pre style={{ background: '#090d16', padding: '16px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#38bdf8', fontSize: '0.8rem', overflowX: 'auto', lineHeight: 1.4 }}>
                {faceIdSdkSnippet}
              </pre>
            </div>
          </section>

          {/* SECTION 7: AZURE WEBHOOK FLAG TELEMETRY */}
          <section id="webhooks" className="glass-panel" style={{ padding: '36px' }}>
            <div className="badge-status badge-green" style={{ marginBottom: '12px' }}>CHAPTER 7</div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
              📡 Live Azure Webhook Flag Telemetry
            </h3>
            <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '20px', fontSize: '0.95rem' }}>
              When a proctor security violation occurs, the widget immediately POSTs a flag payload to the external Azure Webhook API and local proxy:
            </p>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '20px', fontSize: '0.88rem' }}>
              <div><strong>Endpoint:</strong> <code>POST https://examportalv2apitest.azurewebsites.net/api/v1/Proctor/flag</code></div>
              <div><strong>Headers:</strong> <code>TenantCode: MASTER</code>, <code>Content-Type: application/json-patch+json</code></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8' }}>Webhook Body Payload Schema</h4>
              <button onClick={() => copyToClipboard(webhookPayloadSnippet, 's4')} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                {copiedSnippet === 's4' ? '✓ Copied!' : '📋 Copy JSON'}
              </button>
            </div>
            <pre style={{ background: '#090d16', padding: '16px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#34d399', fontSize: '0.8rem', overflowX: 'auto', lineHeight: 1.4 }}>
              {webhookPayloadSnippet}
            </pre>
          </section>

          {/* SECTION 8: REST API REFERENCE */}
          <section id="api" className="glass-panel" style={{ padding: '36px' }}>
            <div className="badge-status badge-green" style={{ marginBottom: '12px' }}>CHAPTER 8</div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '16px', color: '#ffffff' }}>
              ⚙️ REST API Reference
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>POST</span>
                  <code style={{ fontSize: '0.95rem', color: '#ffffff' }}>/api/grade</code>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Evaluates objective and subjective student answers using multi-criteria theory rubrics.</p>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#06b6d4', color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>POST / GET</span>
                  <code style={{ fontSize: '0.95rem', color: '#ffffff' }}>/api/students</code>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Enrolls new candidate records with facial descriptors and performs strict ID & Name candidate queries.</p>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#6366f1', color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>POST</span>
                  <code style={{ fontSize: '0.95rem', color: '#ffffff' }}>/api/parse-document</code>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Parses uploaded PDF, DOCX, CSV, JSON, or TXT files into structured questions via OpenAI.</p>
              </div>

              <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', background: '#10b981', color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>POST / GET</span>
                  <code style={{ fontSize: '0.95rem', color: '#ffffff' }}>/api/reports</code>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Stores and retrieves full post-exam proctoring audit reports and media evidence payloads.</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
