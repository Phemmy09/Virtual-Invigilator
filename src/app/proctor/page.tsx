'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    faceapi: any;
    webkitAudioContext: typeof AudioContext;
  }
}

export interface FlagEvidence {
  id: string;
  sessionId: string;
  timestamp: string;
  eventType: string;
  severity: 'low' | 'medium' | 'critical';
  detailsText: string;
  audioDb: number;
  snapshotUrl?: string;
  videoClipUrl?: string;
}

function ProctorContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId') || 'demo-exam';
  const studentId = searchParams.get('studentId') || 'demo-student';
  const matricNumber = searchParams.get('matricNumber') || '';
  const studentName = searchParams.get('studentName') || '';
  const subject = searchParams.get('subject') || 'CS50 - AI';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState<string>('Initializing Biometric Camera...');
  const [audioDb, setAudioDb] = useState<number>(0);
  const [trustScore, setTrustScore] = useState<number>(100);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [evidenceLogs, setEvidenceLogs] = useState<FlagEvidence[]>([]);

  const evidenceLogsRef = useRef<FlagEvidence[]>([]);
  const lastViolationTimeRef = useRef<{ [key: string]: number }>({});
  const referenceDescriptorRef = useRef<Float32Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Capture instant Base64 high-resolution JPEG image frame
  const captureSnapshot = useCallback((): string | null => {
    if (!videoRef.current) return null;
    try {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = videoRef.current.videoWidth || 320;
      tempCanvas.height = videoRef.current.videoHeight || 240;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, tempCanvas.width, tempCanvas.height);
        return tempCanvas.toDataURL('image/jpeg', 0.85);
      }
    } catch (err) {
      console.error('Error capturing snapshot:', err);
    }
    return null;
  }, []);

  // Record short WebM video clip on flag event
  const recordVideoClip = useCallback((durationMs = 3000): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const stream = mediaStreamRef.current;
        if (!stream || typeof window.MediaRecorder === 'undefined') {
          resolve(null);
          return;
        }

        const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? { mimeType: 'video/webm;codecs=vp9' }
          : MediaRecorder.isTypeSupported('video/webm')
          ? { mimeType: 'video/webm' }
          : undefined;

        const mediaRecorder = new MediaRecorder(stream, options);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, durationMs);
      } catch (err) {
        console.error('Error recording video clip:', err);
        resolve(null);
      }
    });
  }, []);

  // Core trigger violation logic with snapshot & video clip capture
  const triggerViolation = useCallback(async (eventType: string, severity: 'low' | 'medium' | 'critical', detailsText: string) => {
    const now = Date.now();
    const lastTime = lastViolationTimeRef.current[eventType] || 0;
    // Throttle identical flags within 3 seconds
    if (now - lastTime < 3000) return;
    lastViolationTimeRef.current[eventType] = now;

    const warningText = `SECURITY WARNING: ${eventType.replace(/_/g, ' ').toUpperCase()} (${detailsText}). Captured as evidence.`;
    setActiveWarning(warningText);
    setTimeout(() => setActiveWarning(null), 5000);

    // 1. Instantly capture image snapshot
    const snapshotUrl = captureSnapshot();

    // 2. Start recording 2.5 second video clip
    const videoClipUrl = await recordVideoClip(2500);

    const sessionId = `${examId}-${studentId || matricNumber || 'cand'}`;
    const newEvidence: FlagEvidence = {
      id: `ev-${now}-${Math.random().toString(36).substr(2, 6)}`,
      sessionId,
      timestamp: new Date().toISOString(),
      eventType,
      severity,
      detailsText,
      audioDb,
      snapshotUrl: snapshotUrl || undefined,
      videoClipUrl: videoClipUrl || undefined,
    };

    evidenceLogsRef.current = [newEvidence, ...evidenceLogsRef.current];
    setEvidenceLogs((prev) => [newEvidence, ...prev]);

    // Send widget alert to parent window SDK
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'OMNIGUARD_WIDGET_ALERT',
        payload: newEvidence,
      }, '*');
    }

    // POST violation payload to backend API
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventType,
          severity,
          details: { detailsText, audioDb, snapshotUrl, videoClipUrl },
        }),
      });
      const data = await res.json();
      if (data.currentTrustScore !== undefined) {
        setTrustScore(data.currentTrustScore);
      }
    } catch (err) {
      console.error('Failed to log violation:', err);
    }
  }, [examId, studentId, matricNumber, audioDb, captureSnapshot, recordVideoClip]);

  // Load face-api.js script dynamically
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
        setFaceStatus('Biometric AI Engaged. Live Stream Active.');
        startVideoAndAudio();
      }
    } catch (err) {
      console.error('Error loading face-api models:', err);
      setFaceStatus('Error loading AI models.');
    }
  };

  const startVideoAndAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 15 },
        audio: true,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setupAudioMeter(stream);
    } catch (err) {
      console.error('Camera/Microphone access error:', err);
      triggerViolation('no_camera_access', 'critical', 'Camera or microphone access denied by user.');
    }
  };

  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      mediaStreamSource.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const dB = Math.round((average / 255) * 100);
        setAudioDb(dB);

        if (dB > 68) {
          triggerViolation('noise_spike', 'medium', `Loud sound / voice detected: ${dB}dB`);
        }

        requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.error('Audio meter initialization error:', err);
    }
  };

  // Continuous Video Frame & Face Landmark Processing (Yaw, Pitch, Turning)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isModelsLoaded) {
      intervalId = setInterval(async () => {
        if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

        const faceapi = window.faceapi;
        if (faceapi) {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (canvasRef.current && videoRef.current) {
            const displaySize = { width: videoRef.current.width || 320, height: videoRef.current.height || 240 };
            faceapi.matchDimensions(canvasRef.current, displaySize);
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, displaySize.width, displaySize.height);
              faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
            }
          }

          if (detections.length === 0) {
            setFaceStatus('⚠️ NO FACE DETECTED');
            triggerViolation('no_face', 'medium', 'Candidate face out of camera view.');
          } else if (detections.length > 1) {
            setFaceStatus('🚨 MULTIPLE FACES DETECTED');
            triggerViolation('multiple_faces', 'critical', 'Multiple individuals detected in webcam frame.');
          } else {
            const currentDescriptor = detections[0].descriptor;

            if (referenceDescriptorRef.current) {
              const distance = faceapi.euclideanDistance(referenceDescriptorRef.current, currentDescriptor);
              if (distance > 0.6) {
                setFaceStatus(`🚨 FACE MISMATCH (${(distance * 100).toFixed(0)}%)`);
                triggerViolation('face_mismatch', 'critical', `Biometric distance mismatch: ${distance.toFixed(2)}`);
              } else {
                setFaceStatus('✅ Identity Verified (100%)');
              }
            } else {
              referenceDescriptorRef.current = currentDescriptor;
              setFaceStatus('✅ Identity Baseline Established');
            }

            // Directional Face Turning & Gaze Analysis via 68 Landmarks
            const landmarks = detections[0].landmarks;
            const nose = landmarks.getNose();
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

            const eyeDistLeft = Math.abs(nose[0].x - leftEye[0].x);
            const eyeDistRight = Math.abs(nose[0].x - rightEye[0].x);
            const yawRatio = eyeDistLeft / (eyeDistRight || 1);

            // Head Pitch (Vertical Tilt)
            const eyeLevelY = (leftEye[0].y + rightEye[0].y) / 2;
            const noseY = nose[3] ? nose[3].y : nose[0].y;
            const pitchDiff = noseY - eyeLevelY;

            if (yawRatio < 0.35) {
              setFaceStatus('⚠️ FACE TURNED RIGHT');
              triggerViolation('face_turn_right', 'medium', 'Candidate turned face significantly to the right.');
            } else if (yawRatio > 2.8) {
              setFaceStatus('⚠️ FACE TURNED LEFT');
              triggerViolation('face_turn_left', 'medium', 'Candidate turned face significantly to the left.');
            } else if (pitchDiff < 10) {
              setFaceStatus('⚠️ HEAD TILTED UP');
              triggerViolation('face_turn_up', 'low', 'Candidate looking upward away from screen.');
            } else if (pitchDiff > 45) {
              setFaceStatus('⚠️ HEAD LOOKING DOWN');
              triggerViolation('face_turn_down', 'medium', 'Candidate looking down toward desk or phone.');
            }
          }
        }
      }, 3500);
    }

    return () => clearInterval(intervalId);
  }, [isModelsLoaded, triggerViolation]);

  // Generate & Post Complete Exam Audit Report
  const generateAndSendReport = useCallback(async () => {
    const logs = evidenceLogsRef.current;
    const flagCounts = {
      faceTurning: logs.filter((l) => l.eventType.startsWith('face_turn') || l.eventType === 'gaze_deviation').length,
      noiseSpike: logs.filter((l) => l.eventType === 'noise_spike').length,
      missingFace: logs.filter((l) => l.eventType === 'no_face').length,
      multipleFaces: logs.filter((l) => l.eventType === 'multiple_faces').length,
      tabSwitch: logs.filter((l) => l.eventType === 'tab_switch' || l.eventType === 'clipboard_attempt').length,
      other: logs.filter((l) => !['face_turn_left', 'face_turn_right', 'face_turn_up', 'face_turn_down', 'gaze_deviation', 'noise_spike', 'no_face', 'multiple_faces', 'tab_switch', 'clipboard_attempt'].includes(l.eventType)).length,
    };

    const reportPayload = {
      reportId: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sessionId: `${examId}-${studentId || matricNumber || 'cand'}`,
      examId,
      studentId: studentId || matricNumber || 'Alex Mercer',
      matricNumber: matricNumber || 'HVD-2026-8942',
      studentName: studentName || 'Alex Mercer',
      subject: subject || 'CS50 - Artificial Intelligence',
      completedAt: new Date().toISOString(),
      trustScore,
      totalViolations: logs.length,
      flagCounts,
      violations: logs,
    };

    console.log('[OmniGuard Proctor] Generating complete exam report payload:', reportPayload);

    // Relay to parent window SDK
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'OMNIGUARD_EXAM_REPORT',
        report: reportPayload,
      }, '*');
    }

    // POST report to backend API
    try {
      await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload),
      });
    } catch (err) {
      console.error('Failed to post audit report to server:', err);
    }
  }, [examId, studentId, matricNumber, studentName, subject, trustScore]);

  // Listen for parent SDK messages
  useEffect(() => {
    const handleParentMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'OMNIGUARD_PARENT_VIOLATION') {
        triggerViolation(event.data.eventType, event.data.severity, event.data.detailsText);
      } else if (event.data.type === 'OMNIGUARD_REQUEST_REPORT') {
        generateAndSendReport();
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [triggerViolation, generateAndSendReport]);

  return (
    <div style={{ padding: '10px', color: '#f8fafc', fontFamily: 'sans-serif', position: 'relative', height: '100%', boxSizing: 'border-box', background: '#090d16' }}>
      {activeWarning && (
        <div style={{
          position: 'absolute',
          top: '4px',
          left: '4px',
          right: '4px',
          zIndex: 99,
          background: 'rgba(244, 63, 94, 0.95)',
          color: '#ffffff',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '0.7rem',
          fontWeight: 700,
          boxShadow: '0 4px 12px rgba(244, 63, 94, 0.6)'
        }}>
          {activeWarning}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', color: '#38bdf8' }}>OMNIGUARD AI</span>
        </div>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 800,
          padding: '2px 8px',
          borderRadius: '12px',
          background: trustScore > 75 ? 'rgba(16, 185, 129, 0.2)' : trustScore > 50 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(244, 63, 94, 0.2)',
          color: trustScore > 75 ? '#34d399' : trustScore > 50 ? '#facc15' : '#fb7185',
          border: trustScore > 75 ? '1px solid #10b981' : trustScore > 50 ? '1px solid #eab308' : '1px solid #f43f5e'
        }}>
          Trust: {trustScore}%
        </div>
      </div>

      <div style={{ position: 'relative', width: '320px', height: '175px', borderRadius: '8px', overflow: 'hidden', background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <video
          ref={videoRef}
          width="320"
          height="175"
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas
          ref={canvasRef}
          width="320"
          height="175"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      </div>

      <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
        <span>Status: <strong style={{ color: '#ffffff' }}>{faceStatus}</strong></span>
        <span>Mic: <strong style={{ color: audioDb > 68 ? '#f43f5e' : '#34d399' }}>{audioDb} dB</strong></span>
      </div>

      <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#64748b' }}>
        <span>Flags Captured: <strong style={{ color: '#06b6d4' }}>{evidenceLogs.length}</strong></span>
        <button
          onClick={generateAndSendReport}
          style={{ background: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: '0.65rem' }}
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}

export default function ProctorPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: '20px' }}>Loading OmniGuard Invigilator...</div>}>
      <ProctorContent />
    </Suspense>
  );
}
