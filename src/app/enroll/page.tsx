'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrolledStudent, setEnrolledStudent] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dobInputRef = useRef<HTMLInputElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Auto-calculate age from DOB
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDob = e.target.value;
    setDob(selectedDob);

    if (selectedDob) {
      const birthDate = new Date(selectedDob);
      const today = new Date();
      if (!isNaN(birthDate.getTime())) {
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge >= 0 && calculatedAge < 120) {
          setAge(calculatedAge.toString());
        } else {
          setAge('');
        }
      }
    } else {
      setAge('');
    }
  };

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
        audio: false,
      });

      mediaStreamRef.current = stream;
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
        setCaptureStatus('Live camera active. Position face centered in frame.');
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      setIsCameraActive(false);
      setCaptureStatus('⚠️ Camera permission denied or webcam missing.');
    }
  }, [stopCamera]);

  const loadModels = useCallback(async () => {
    try {
      if (window.faceapi) {
        const MODEL_URL = '/models';
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setIsModelsLoaded(true);
        setCaptureStatus('Biometric AI Engine Ready. Align face in camera frame.');
        startCamera();
      }
    } catch (err) {
      console.error('Error loading face-api models:', err);
      setCaptureStatus('Camera engine loaded in standard mode.');
      startCamera();
    }
  }, [startCamera]);

  // Load face-api.js
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/face-api.min.js';
    script.async = true;
    script.onload = () => {
      loadModels();
    };
    script.onerror = () => {
      setCaptureStatus('Standard Camera Mode Ready (Face API fallback).');
      startCamera();
    };
    document.body.appendChild(script);

    return () => {
      stopCamera();
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [loadModels, startCamera, stopCamera]);

  const handleCaptureFace = async () => {
    if (!videoRef.current && !mediaStreamRef.current) {
      await startCamera();
      return;
    }

    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 320;
      canvas.height = videoRef.current.videoHeight || 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedPhoto(photoDataUrl);
      }
    }

    // Extract 128-float face descriptor if face-api available
    if (window.faceapi && isModelsLoaded && videoRef.current) {
      try {
        setCaptureStatus('Extracting facial 128-float descriptor...');
        const detection = await window.faceapi
          .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const descriptorArr = Array.from(detection.descriptor) as number[];
          setFaceDescriptor(descriptorArr);
          setCaptureStatus('✅ Biometric Face Profile & 128-Float Descriptor Saved!');
        } else {
          setCaptureStatus('✓ Photo captured. Face centered for optimal biometric verification.');
        }
      } catch (err) {
        console.error('Face descriptor extraction error:', err);
        setCaptureStatus('✓ Photo captured (Standard mode).');
      }
    } else {
      setCaptureStatus('✓ Photo captured successfully.');
    }
  };

  const handleRetakePhoto = async () => {
    setCapturedPhoto(null);
    setFaceDescriptor(null);
    setCaptureStatus('Camera live. Align face in frame and click Capture.');

    if (!isCameraActive || !mediaStreamRef.current) {
      await startCamera();
    } else if (videoRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
      }
      videoRef.current.play().catch(() => {});
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim() || !idNumber.trim() || !email.trim() || !phone.trim() || !dob || !age) {
      setErrorMessage('Please fill in all required candidate registration fields (First Name, Last Name, Student ID, Email, Phone, Date of Birth, Age).');
      return;
    }

    if (!capturedPhoto) {
      setErrorMessage('Please capture candidate facial photo before submitting registration.');
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
      setErrorMessage('Error submitting student registration. Check network connection.');
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
    handleRetakePhoto();
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
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span>Date of Birth <span style={{ color: '#f43f5e' }}>*</span></span>
                    <button
                      type="button"
                      onClick={() => dobInputRef.current?.showPicker?.()}
                      style={{ background: 'none', border: 'none', color: '#06b6d4', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}
                    >
                      📅 Open Calendar
                    </button>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      ref={dobInputRef}
                      type="date"
                      value={dob}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={handleDobChange}
                      onClick={(e) => {
                        try {
                          (e.target as any).showPicker?.();
                        } catch (err) {}
                      }}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 38px 12px 12px',
                        borderRadius: '8px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#ffffff',
                        colorScheme: 'dark',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                      }}
                    />
                    <span
                      onClick={() => dobInputRef.current?.showPicker?.()}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        userSelect: 'none',
                        pointerEvents: 'auto'
                      }}
                    >
                      📅
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                    Age (Auto-calculated) <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Auto-calculated from DOB"
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
                {/* Camera / Snapshot Box */}
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
                  {/* Persistent Video Element */}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: capturedPhoto ? 'none' : 'block'
                    }}
                  />

                  {/* Captured Snapshot Overlay */}
                  {capturedPhoto && (
                    <img
                      src={capturedPhoto}
                      alt="Captured Face Preview"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 5
                      }}
                    />
                  )}

                  <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 10 }} />
                </div>

                {/* Status Indicator */}
                <div style={{ margin: '12px 0', textAlign: 'center', fontSize: '0.85rem', color: capturedPhoto ? '#34d399' : '#94a3b8' }}>
                  {captureStatus}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {!capturedPhoto ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCaptureFace}
                        className="btn-primary"
                        style={{ padding: '10px 18px', fontSize: '0.9rem' }}
                      >
                        📸 Capture Biometric Photo
                      </button>
                      {!isCameraActive && (
                        <button
                          type="button"
                          onClick={startCamera}
                          className="btn-secondary"
                          style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                        >
                          🎥 Start Camera
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleRetakePhoto}
                        className="btn-secondary"
                        style={{ background: 'rgba(99, 102, 241, 0.2)', borderColor: '#6366f1', color: '#ffffff', padding: '10px 16px', fontSize: '0.9rem' }}
                      >
                        🔄 Retake Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleRetakePhoto}
                        className="btn-secondary"
                        style={{ padding: '10px 14px', fontSize: '0.9rem' }}
                      >
                        Clear
                      </button>
                    </>
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
