'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

declare global {
  interface Window {
    faceapi: any;
  }
}

export default function StudentEnrollment() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [captureStatus, setCaptureStatus] = useState<string>('Initializing Biometric Camera Engine...');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrolledStudent, setEnrolledStudent] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-calculate age from DOB
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDob = e.target.value;
    setDob(selectedDob);

    if (selectedDob) {
      const birthDate = new Date(selectedDob);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (!isNaN(calculatedAge) && calculatedAge >= 0) {
        setAge(calculatedAge.toString());
      }
    }
  };

  // Load face-api.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/face-api.min.js';
    script.async = true;
    script.onload = () => {
      loadModels();
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const loadModels = async () => {
    try {
      if (window.faceapi) {
        const MODEL_URL = '/models';
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setIsModelsLoaded(true);
        setCaptureStatus('Ready. Turn on camera to capture face profile.');
        startCamera();
      }
    } catch (err) {
      console.error('Error loading face-api models:', err);
      setCaptureStatus('Camera engine loaded in standard mode.');
      startCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 15 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCaptureStatus('Camera live. Align face in frame and click Capture.');
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      setCaptureStatus('⚠️ Camera access denied or missing.');
    }
  };

  const handleCaptureFace = async () => {
    if (!videoRef.current) return;

    // Capture snapshot as base64 string
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 320;
    canvas.height = videoRef.current.videoHeight || 240;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhoto(photoDataUrl);
    }

    // Extract 128-float face descriptor if face-api available
    if (window.faceapi && isModelsLoaded) {
      try {
        const detection = await window.faceapi
          .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const descriptorArr = Array.from(detection.descriptor) as number[];
          setFaceDescriptor(descriptorArr);
          setCaptureStatus('✅ Biometric Face Profile & 128-Float Descriptor Captured!');
        } else {
          setCaptureStatus('⚠️ Photo captured. Align face centered for best biometric matching.');
        }
      } catch (err) {
        console.error('Face descriptor extraction error:', err);
        setCaptureStatus('✓ Photo captured (standard mode).');
      }
    } else {
      setCaptureStatus('✓ Photo captured.');
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim() || !idNumber.trim() || !email.trim() || !phone.trim() || !dob || !age) {
      setErrorMessage('Please fill in all required registration details (First Name, Last Name, ID Number, Email, Phone, Date of Birth, Age).');
      return;
    }

    if (!capturedPhoto) {
      setErrorMessage('Please capture candidate face photo before submitting registration.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        idNumber: idNumber.trim(),
        email: email.trim(),
        phone: phone.trim(),
        dob: dob,
        age: parseInt(age, 10) || age,
        photoUrl: capturedPhoto,
        faceDescriptor: faceDescriptor || null,
      };

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.student) {
        setEnrolledStudent(data.student);
      } else {
        setErrorMessage(data.error || 'Failed to register student.');
      }
    } catch (err: any) {
      console.error('Enrollment submission error:', err);
      setErrorMessage('Error submitting student registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setIdNumber('');
    setEmail('');
    setPhone('');
    setDob('');
    setAge('');
    setCapturedPhoto(null);
    setFaceDescriptor(null);
    setEnrolledStudent(null);
    setErrorMessage(null);
    setCaptureStatus('Align face in frame and click Capture.');
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <Link href="/" style={{ color: '#06b6d4', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          ← Back to Home
        </Link>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/dashboard" className="btn-secondary" style={{ textDecoration: 'none' }}>
            🏫 Teacher Command Center
          </Link>
          <Link href="/student" className="btn-primary" style={{ textDecoration: 'none' }}>
            ✍️ Student Exam Login
          </Link>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          display: 'inline-block',
          padding: '6px 16px',
          borderRadius: '20px',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#818cf8',
          fontSize: '0.85rem',
          fontWeight: 700,
          marginBottom: '12px'
        }}>
          INSTITUTIONAL REGISTRATION PORTAL
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px' }}>
          Student Registration & Biometric Enrollment
        </h1>
        <p style={{ color: '#94a3b8', maxWidth: '640px', margin: '0 auto', fontSize: '0.95rem' }}>
          Input candidate credentials (First Name, Last Name, Student ID, Email, Phone, Date of Birth, Age) and record live biometric facial photo profile.
        </p>
      </div>

      {/* SUCCESS CARD */}
      {enrolledStudent ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            margin: '0 auto 16px auto',
          }}>
            ✅
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginBottom: '8px' }}>
            Student Registered Successfully!
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '24px' }}>
            Registration & facial biometric profile created for candidate <strong>{enrolledStudent.name}</strong>.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            padding: '24px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'left',
            marginBottom: '28px'
          }}>
            {enrolledStudent.photoUrl ? (
              <img
                src={enrolledStudent.photoUrl}
                alt={enrolledStudent.name}
                style={{ width: '110px', height: '110px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #06b6d4' }}
              />
            ) : (
              <div style={{ width: '110px', height: '110px', borderRadius: '12px', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                👤
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem', color: '#cbd5e1' }}>
              <div><strong>Name:</strong> {enrolledStudent.firstName} {enrolledStudent.lastName}</div>
              <div><strong>Student ID:</strong> <span style={{ color: '#06b6d4' }}>{enrolledStudent.idNumber}</span></div>
              <div><strong>Email:</strong> {enrolledStudent.email}</div>
              <div><strong>Phone:</strong> {enrolledStudent.phone}</div>
              <div><strong>Date of Birth:</strong> {enrolledStudent.dob} (Age: {enrolledStudent.age})</div>
              <div><strong>Biometric Status:</strong> <span style={{ color: '#10b981' }}>✓ 128-Float Vector Saved</span></div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
            <button onClick={resetForm} className="btn-secondary">
              + Register Another Student
            </button>
            <Link href="/student" className="btn-primary" style={{ textDecoration: 'none' }}>
              Proceed to Student Exam Login →
            </Link>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM */
        <form onSubmit={handleEnrollSubmit} className="glass-panel" style={{ padding: '40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '36px' }}>
            {/* Left: Required Candidate Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
                1. Required Candidate Details
              </h3>

              {/* First Name & Last Name */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    First Name <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Last Name <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mercer"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Student ID & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Student ID Number <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. HVD-2026-8942"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Email Address <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. alex.mercer@harvard.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                  Phone Number <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +1 (555) 234-5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Date of Birth & Age */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Date of Birth <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={handleDobChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Age (Auto-calculated) <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 24"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Camera Biometric Capture */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '10px' }}>
                2. Biometric Photo Capture <span style={{ color: '#f43f5e' }}>*</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  position: 'relative',
                  width: '320px',
                  height: '240px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: capturedPhoto ? '2px solid #10b981' : '2px dashed rgba(99, 102, 241, 0.5)',
                  background: '#090d16',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {capturedPhoto ? (
                    <img
                      src={capturedPhoto}
                      alt="Captured Face Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                  <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
                </div>

                <div style={{ margin: '12px 0', textAlign: 'center', fontSize: '0.85rem', color: capturedPhoto ? '#34d399' : '#94a3b8' }}>
                  {captureStatus}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={handleCaptureFace}
                    className="btn-secondary"
                    style={{ background: 'rgba(99, 102, 241, 0.2)', borderColor: '#6366f1', color: '#ffffff' }}
                  >
                    📸 {capturedPhoto ? 'Retake Photo' : 'Capture Biometric Photo'}
                  </button>
                  {capturedPhoto && (
                    <button
                      type="button"
                      onClick={() => setCapturedPhoto(null)}
                      className="btn-secondary"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  color: '#fb7185',
                  fontSize: '0.85rem',
                }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  marginTop: 'auto',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Registering Student...' : '💾 Submit Student Registration'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
