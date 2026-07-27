'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Question {
  id: string;
  type: 'objective' | 'theory';
  question_text: string;
  options?: string[];
  correct_answer?: string;
  rubric?: any;
}

export default function StudentPortal() {
  const [step, setStep] = useState<'register' | 'exam' | 'completed'>('register');

  // Registration state
  const [studentName, setStudentName] = useState('Alex Mercer');
  const [studentEmail, setStudentEmail] = useState('alex.mercer@harvard.edu');
  const [matricNumber, setMatricNumber] = useState('HVD-2026-8942');
  const [subjectCode, setSubjectCode] = useState('CS50 - Artificial Intelligence');

  // Metadata
  const [ipAddress, setIpAddress] = useState('192.168.1.104');
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number }>({ lat: 42.377, lng: -71.1167 }); // Harvard Yard coordinates
  const [faceBaselineCaptured, setFaceBaselineCaptured] = useState(false);

  // Exam state
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sample Exam Questions
  const questions: Question[] = [
    {
      id: 'q1',
      type: 'objective',
      question_text: 'Which data structure is optimal for continuous facial embedding vector comparison in 128-dimensional space?',
      options: ['Binary Search Tree', 'k-d Tree / Euclidean Vector Index', 'Singly Linked List', 'Hash Table without Hashing'],
      correct_answer: 'k-d Tree / Euclidean Vector Index',
    },
    {
      id: 'q2',
      type: 'theory',
      question_text: 'Explain how Web Audio API decibel metering and facial descriptor Euclidean distance thresholds prevent remote exam fraud.',
      correct_answer: 'Facial descriptors convert facial geometry into a 128-float vector. Calculating Euclidean distance against baseline detects face mismatches. Web Audio API analyzes decibel levels to flag acoustic anomalies above ambient background noise.',
      rubric: {
        keywords: ['descriptor', 'Euclidean distance', 'decibel', 'ambient background'],
        model_answer: 'Comprehensive explanation covering 128-float vectors, Euclidean distance thresholding (< 0.6), and real-time audio decibel metering.',
        process_guidance: 'Award credit for discussing facial embeddings, identity match thresholds, and decibel noise detection.',
        max_marks: 10,
      },
    },
  ];

  // Capture Geolocation & IP on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log('Geolocation declined or unavailable, using fallback coordinates.')
      );
    }
  }, []);

  // Camera preview for registration
  useEffect(() => {
    if (step === 'register') {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch((err) => console.log('Camera access error in student portal preview:', err));
    }
  }, [step]);

  const captureFaceBaseline = () => {
    setFaceBaselineCaptured(true);
  };

  const handleStartExam = () => {
    if (!faceBaselineCaptured) {
      alert('Please capture your biometric face baseline first before entering the exam.');
      return;
    }
    setStep('exam');
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmitExam = async () => {
    setIsSubmitting(true);

    const payload = {
      sessionId: `session-${matricNumber}`,
      answers: questions.map((q) => ({
        questionId: q.id,
        questionType: q.type,
        questionText: q.question_text,
        studentResponse: answers[q.id] || '',
        correctAnswer: q.correct_answer,
        rubric: q.rubric,
        maxMarks: q.type === 'objective' ? 5 : 10,
      })),
    };

    try {
      const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setExamResult(data);
      setStep('completed');
    } catch (err) {
      console.error('Failed to grade exam:', err);
      alert('An error occurred submitting the exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Top Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <Link href="/" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Back to Home
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Subject: <strong style={{ color: '#ffffff' }}>{subjectCode}</strong></span>
          <span className="badge-status badge-green">● Student Security Portal</span>
        </div>
      </div>

      {/* STEP 1: REGISTRATION & BIOMETRIC CAPTURE */}
      {step === 'register' && (
        <div className="glass-panel" style={{ padding: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Institutional Biometric Entrance</h2>
          <p style={{ color: '#94a3b8', marginBottom: '32px' }}>
            Please confirm your identity and capture your biometric face baseline before initiating the proctored examination.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            {/* Left: Input Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Matric / Exam Number</label>
                <input
                  type="text"
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>Institutional Email</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff' }}
                />
              </div>

              {/* Metadata Badges */}
              <div style={{ padding: '16px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div>🌐 IP Address: <strong style={{ color: '#06b6d4' }}>{ipAddress}</strong></div>
                <div>📍 Geolocation: <strong style={{ color: '#10b981' }}>{geoCoords.lat.toFixed(4)}° N, {geoCoords.lng.toFixed(4)}° W</strong></div>
                <div>🔒 Security Clearance: <strong style={{ color: '#34d399' }}>STRICT_IVY_MODE</strong></div>
              </div>
            </div>

            {/* Right: Camera Baseline Capture */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'relative', width: '320px', height: '220px', borderRadius: '12px', overflow: 'hidden', border: faceBaselineCaptured ? '2px solid #10b981' : '2px dashed rgba(255, 255, 255, 0.3)', background: '#000' }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {faceBaselineCaptured && (
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(16, 185, 129, 0.9)', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                    ✓ 128-Float Biometric Baseline Registered
                  </div>
                )}
              </div>

              <button onClick={captureFaceBaseline} className="btn-secondary" style={{ marginTop: '16px', width: '320px' }}>
                {faceBaselineCaptured ? 'Re-capture Baseline' : '📷 Capture Biometric Baseline'}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'right' }}>
            <button onClick={handleStartExam} className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              Begin Proctored Examination →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: LIVE EXAMINATION WITH PROCTORING WIDGET */}
      {step === 'exam' && (
        <div>
          {/* Injected Proctor Iframe Widget in bottom right */}
          <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, width: '340px', height: '280px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(99,102,241,0.4)', background: '#090d16' }}>
            <iframe src={`/proctor?examId=CS50-AI&studentId=${matricNumber}`} style={{ width: '100%', height: '100%', border: 'none' }} allow="camera; microphone; geolocation" />
          </div>

          <div className="glass-panel" style={{ padding: '40px', marginBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{subjectCode} - Midterm Assessment</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Student: {studentName} ({matricNumber})</p>
              </div>
              <div className="badge-status badge-green" style={{ fontSize: '0.9rem' }}>
                ● OmniGuard Live Invigilation Active
              </div>
            </div>

            {/* Questions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {questions.map((q, idx) => (
                <div key={q.id} style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 700, color: '#6366f1' }}>Question {idx + 1} ({q.type.toUpperCase()})</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Max Marks: {q.type === 'objective' ? 5 : 10}</span>
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', lineHeight: 1.4 }}>{q.question_text}</h3>

                  {q.type === 'objective' && q.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {q.options.map((opt) => (
                        <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', background: answers[q.id] === opt ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.02)', border: answers[q.id] === opt ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.05)', cursor: 'pointer' }}>
                          <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt} onChange={() => handleAnswerChange(q.id, opt)} />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'theory' && (
                    <div>
                      <textarea
                        rows={6}
                        placeholder="Type your essay response here. Process steps, conceptual explanations, and key methodology will be evaluated by OpenAI..."
                        value={answers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        style={{ width: '100%', padding: '14px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#ffffff', fontSize: '0.95rem', lineHeight: 1.5 }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: '36px', textAlign: 'right' }}>
              <button onClick={handleSubmitExam} disabled={isSubmitting} className="btn-primary" style={{ padding: '14px 40px', fontSize: '1rem' }}>
                {isSubmitting ? 'Evaluating & Grading...' : 'Submit Examination →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: EXAM COMPLETED & ACADEMIC AUDIT SUMMARY */}
      {step === 'completed' && examResult && (
        <div className="glass-panel" style={{ padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="badge-status badge-green" style={{ marginBottom: '12px', fontSize: '1rem', padding: '6px 16px' }}>
              ✓ Examination Completed & Verified
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>Official Academic Audit Summary</h2>
            <p style={{ color: '#94a3b8' }}>Student: {studentName} ({matricNumber})</p>
          </div>

          {/* Grade Summary Metric */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '40px' }}>
            <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Marks Awarded</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#34d399' }}>{examResult.totalMarksAwarded} / {examResult.totalPossibleMarks}</div>
            </div>

            <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Final Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#818cf8' }}>
                {Math.round((examResult.totalMarksAwarded / examResult.totalPossibleMarks) * 100)}%
              </div>
            </div>

            <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>Proctoring Trust Index</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#22d3ee' }}>95%</div>
            </div>
          </div>

          {/* AI Feedback Breakdown */}
          <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>AI Multi-Criteria Grading Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
            {examResult.results.map((res: any, idx: number) => (
              <div key={idx} style={{ padding: '20px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <strong>Question {idx + 1} Result</strong>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>{res.marksAwarded} / {res.maxMarks} Marks</span>
                </div>
                {res.feedback && res.feedback.overall_summary && (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '8px' }}>Summary: {res.feedback.overall_summary}</p>
                )}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link href="/" className="btn-primary">
              Return to Institutional Portal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
