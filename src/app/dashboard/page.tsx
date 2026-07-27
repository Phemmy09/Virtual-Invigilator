'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputPassword, setInputPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'upload' | 'questions' | 'live' | 'audit'>('upload');

  // Check session storage on mount
  useEffect(() => {
    const sessionAuth = sessionStorage.getItem('teacher_authenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === 'Admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('teacher_authenticated', 'true');
      setAuthError(null);
    } else {
      setAuthError('Access Denied: Incorrect password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('teacher_authenticated');
    setInputPassword('');
  };

  // Document Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  // Exam Question Bank
  const [questionBank, setQuestionBank] = useState<any[]>([
    {
      id: '1',
      type: 'objective',
      question_text: 'Which vector distance metric is used for 128-float face embedding comparison?',
      options: ['Euclidean Distance', 'Manhattan Distance', 'Hamming Distance', 'Jaccard Index'],
      correct_answer: 'Euclidean Distance',
    },
    {
      id: '2',
      type: 'theory',
      question_text: 'Explain the principles of facial embedding matching and decibel noise monitoring in online exam security.',
      rubric: {
        keywords: ['descriptor', 'Euclidean distance', 'decibel', 'ambient baseline'],
        model_answer: 'Full explanation covering 128-dimensional vectors, Euclidean distance thresholding, and Web Audio API decibel metering.',
        max_marks: 10,
      },
    },
  ]);

  // Live Sessions Mock Data
  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      studentName: 'Alex Mercer',
      matricNumber: 'HVD-2026-8942',
      subject: 'CS50 - Artificial Intelligence',
      ip: '192.168.1.104',
      location: '42.3770° N, 71.1167° W (Cambridge, MA)',
      trustScore: 95,
      status: 'active',
      violationsCount: 1,
    },
    {
      id: 'sess-2',
      studentName: 'Eleanor Vance',
      matricNumber: 'HVD-2026-4419',
      subject: 'CS50 - Artificial Intelligence',
      ip: '192.168.1.189',
      location: '42.3736° N, 71.1097° W (Boston, MA)',
      trustScore: 48,
      status: 'flagged_terminated',
      violationsCount: 5,
    },
  ]);

  // Handle Multi-Format Document Upload (PDF, DOCX, CSV, JSON, TXT)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(`Uploading & Parsing ${file.name} via OpenAI gpt-4o...`);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.questions) {
        setQuestionBank((prev) => [...prev, ...data.questions]);
        setUploadStatus(`✓ Successfully extracted ${data.questions.length} questions & rubrics from ${file.name}!`);
        setActiveTab('questions');
      } else {
        setUploadStatus(`⚠️ Parse error: ${data.error || 'Unable to parse file'}`);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadStatus('⚠️ Error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '480px', margin: '80px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
            ← Back to Home
          </Link>
        </div>

        <div className="glass-panel" style={{ padding: '40px 32px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            margin: '0 auto 24px auto',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)'
          }}>
            🔐
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: '#f8fafc' }}>
            Teacher Command Center
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '28px', lineHeight: 1.5 }}>
            Restricted Access. Please enter the institutional security password to access live proctoring & exam controls.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <input
                type="password"
                placeholder="Enter password (e.g. Admin123)"
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: authError ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                autoFocus
              />
            </div>

            {authError && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.4)',
                color: '#fb7185',
                fontSize: '0.85rem',
                textAlign: 'left',
              }}>
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                marginTop: '8px',
                cursor: 'pointer',
              }}
            >
              Unlock Command Center
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <Link href="/" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 700 }}>
          ← Institutional Portal
        </Link>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setActiveTab('upload')}
            className={activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}
          >
            📄 Upload Exam Files
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={activeTab === 'questions' ? 'btn-primary' : 'btn-secondary'}
          >
            📚 Question Bank ({questionBank.length})
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={activeTab === 'live' ? 'btn-primary' : 'btn-secondary'}
          >
            👁️ Live Invigilator Grid
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}
          >
            📊 Integrity Audit Reports
          </button>

          <button
            onClick={handleLogout}
            className="btn-secondary"
            style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#fb7185' }}
            title="Lock Command Center"
          >
            🔒 Lock
          </button>
        </div>
      </div>

      {/* TAB 1: FILE UPLOAD ZONE */}
      {activeTab === 'upload' && (
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>Multi-Format AI Exam Upload</h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto 32px auto', lineHeight: 1.5 }}>
            Upload exam questions, model answer keys, and marking guides in <strong>PDF</strong>, <strong>DOCX</strong>, <strong>CSV</strong>, <strong>JSON</strong>, or <strong>TXT</strong> format. OpenAI will automatically structure questions and theory rubrics.
          </p>

          <div style={{ border: '2px dashed rgba(99, 102, 241, 0.4)', padding: '40px', borderRadius: '16px', background: 'rgba(99, 102, 241, 0.03)', width: '100%', maxWidth: '600px', margin: '0 auto 24px auto', cursor: 'pointer' }}>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.csv,.json,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="exam-file-input"
            />
            <label htmlFor="exam-file-input" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', marginBottom: '8px' }}>
                Click to Select Exam File (.pdf, .docx, .csv, .json, .txt)
              </div>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Maximum file size: 25MB
              </div>
            </label>
          </div>

          {uploadStatus && (
            <div style={{ padding: '12px 20px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#06b6d4', display: 'inline-block' }}>
              {uploading ? '⏳ ' : ''}{uploadStatus}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: QUESTION BANK */}
      {activeTab === 'questions' && (
        <div className="glass-panel" style={{ padding: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Extracted Question Bank</h2>
            <button onClick={() => setActiveTab('upload')} className="btn-secondary">
              + Add More Files
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {questionBank.map((q, idx) => (
              <div key={idx} style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className={`badge-status ${q.type === 'objective' ? 'badge-green' : 'badge-yellow'}`}>
                    {q.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>ID: q-{idx + 1}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>{q.question_text}</h3>
                {q.options && (
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                    Options: {q.options.join(' | ')}
                  </div>
                )}
                {q.rubric && q.rubric.keywords && (
                  <div style={{ fontSize: '0.85rem', color: '#06b6d4', marginTop: '8px' }}>
                    🔑 Rubric Keywords: {q.rubric.keywords.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE INVIGILATOR GRID */}
      {activeTab === 'live' && (
        <div className="glass-panel" style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '24px' }}>Real-Time Invigilator Monitoring Grid</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            {sessions.map((s) => (
              <div key={s.id} style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: s.trustScore < 60 ? '1px solid #f43f5e' : '1px solid rgba(255, 255, 255, 0.08)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{s.studentName}</h3>
                  <span className={`badge-status ${s.trustScore > 75 ? 'badge-green' : 'badge-red'}`}>
                    Trust: {s.trustScore}%
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>Matric Number: <strong style={{ color: '#fff' }}>{s.matricNumber}</strong></div>
                  <div>Subject: <strong style={{ color: '#fff' }}>{s.subject}</strong></div>
                  <div>IP Address: <strong style={{ color: '#06b6d4' }}>{s.ip}</strong></div>
                  <div>Location: <strong style={{ color: '#10b981' }}>{s.location}</strong></div>
                  <div>Security Logs: <strong style={{ color: s.violationsCount > 2 ? '#f43f5e' : '#fbbf24' }}>{s.violationsCount} Flags Recorded</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INTEGRITY AUDIT REPORTS */}
      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '24px' }}>Institutional Academic Integrity Audit</h2>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px' }}>Student</th>
                <th style={{ padding: '12px' }}>Matric No</th>
                <th style={{ padding: '12px' }}>IP / Location</th>
                <th style={{ padding: '12px' }}>Trust Index</th>
                <th style={{ padding: '12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <td style={{ padding: '16px 12px', fontWeight: 600 }}>{s.studentName}</td>
                  <td style={{ padding: '16px 12px', color: '#94a3b8' }}>{s.matricNumber}</td>
                  <td style={{ padding: '16px 12px', color: '#06b6d4', fontSize: '0.85rem' }}>{s.ip} ({s.location})</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span className={`badge-status ${s.trustScore > 75 ? 'badge-green' : 'badge-red'}`}>
                      {s.trustScore}%
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', color: s.status === 'active' ? '#34d399' : '#f87171' }}>
                    {s.status.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
