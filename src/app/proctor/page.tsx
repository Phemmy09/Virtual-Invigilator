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
  eventType: string; // FULLSCREEN_CHANGE, TAB_FOCUS_CHANGE, EXIT_FULLSCREEN, FACE_ABSENCE, MULTIPLE_FACE, SOUND_DETECTED, TAB_NOT_FOCUS, SUSPICIOUS_ACTIVITY
  severity: 'low' | 'medium' | 'critical';
  detailsText: string;
  audioDb: number;
  snapshotUrl?: string;
  videoClipUrl?: string;
}

const EXTERNAL_WEBHOOK_URL = 'https://examportalv2apitest.azurewebsites.net/api/v1/Proctor/flag';

function ProctorContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId') || searchParams.get('exam_id') || '568';
  const candidateId = searchParams.get('candidateId') || searchParams.get('studentId') || 'a5c69632941a4c99ad0d028e64eac468';
  const tenantCode = searchParams.get('tenantCode') || searchParams.get('TenantCode') || 'MASTER';
  const domain = searchParams.get('domain') || 'AI_TESTING';
  const eventName = searchParams.get('event') || 'AI_FLAG';
  const studentName = searchParams.get('studentName') || searchParams.get('name') || 'Alex Mercer';
  const subject = searchParams.get('subject') || 'CS50 - AI Exam';

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

  // Capture Base64 JPEG frame snapshot
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
  const recordVideoClip = useCallback((durationMs = 2500): Promise<string | null> => {
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

  // Send Proctor Flag to External Webhook Endpoint & Local Proxy
  const postFlagToWebhook = useCallback(async (flagPayload: any) => {
    console.log('[Proctor Widget] Posting Flag Payload to Azure Webhook:', flagPayload);

    // 1. Direct fetch to Azure Webhook Endpoint
    try {
      await fetch(EXTERNAL_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'TenantCode': tenantCode || 'MASTER',
          'Content-Type': 'application/json-patch+json',
        },
        body: JSON.stringify(flagPayload),
      });
    } catch (err) {
      console.warn('[Proctor Widget] Direct Azure Webhook fetch error (falling back to proxy):', err);
    }

    // 2. Proxy fetch to guarantee server-side delivery
    try {
      await fetch('/api/webhook/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...flagPayload,
          tenantCode: tenantCode || 'MASTER',
        }),
      });
    } catch (err) {
      console.error('[Proctor Widget] Webhook proxy fetch error:', err);
    }
  }, [tenantCode]);

  // Core trigger violation logic with snapshot & video clip capture
  const triggerViolation = useCallback(async (eventType: string, severity: 'low' | 'medium' | 'critical', detailsText: string) => {
    const now = Date.now();
    const lastTime = lastViolationTimeRef.current[eventType] || 0;
    // Throttle identical flags within 3 seconds
    if (now - lastTime < 3000) return;
    lastViolationTimeRef.current[eventType] = now;

    const warningText = `SECURITY WARNING: ${eventType.replace(/_/g, ' ')} (${detailsText}). Recorded & flagged.`;
    setActiveWarning(warningText);
    setTimeout(() => setActiveWarning(null), 5000);

    // 1. Instantly capture snapshot frame
    const snapshotUrl = captureSnapshot();

    // 2. Start recording video clip asynchronously
    const videoClipUrl = await recordVideoClip(2500);

    const flagId = `flag_${now}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionId = `${examId}-${candidateId}`;

    const newEvidence: FlagEvidence = {
      id: flagId,
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

    // Construct Webhook Body Payload matching exact specification
    const webhookBodyPayload = {
      flagId,
      candidateId,
      examId,
      type: eventType, // FULLSCREEN_CHANGE, TAB_FOCUS_CHANGE, EXIT_FULLSCREEN, FACE_ABSENCE, MULTIPLE_FACE, SOUND_DETECTED, TAB_NOT_FOCUS, SUSPICIOUS_ACTIVITY
      domain, // "AI_TESTING"
      mediaUrl: snapshotUrl || videoClipUrl || '',
      description: detailsText,
      event: eventName, // "AI_FLAG"
    };

    // Post to Azure Webhook
    postFlagToWebhook(webhookBodyPayload);

    // Send widget alert to parent window SDK
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'OMNIGUARD_WIDGET_ALERT',
        payload: {
          ...newEvidence,
          webhookPayload: webhookBodyPayload,
        },
      }, '*');
    }

    // POST violation payload to backend API logs
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventType,
          severity,
          details: { detailsText, audioDb, snapshotUrl, videoClipUrl, flagId, candidateId, examId },
        }),
      });
      const data = await res.json();
      if (data.currentTrustScore !== undefined) {
        setTrustScore(data.currentTrustScore);
      }
    } catch (err) {
      console.error('Failed to log violation internally:', err);
    }
  }, [examId, candidateId, domain, eventName, audioDb, captureSnapshot, recordVideoClip, postFlagToWebhook]);

  // Handle Fullscreen & Tab Focus Events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('TAB_NOT_FOCUS', 'medium', 'Browser tab lost visibility / minimized.');
        triggerViolation('TAB_FOCUS_CHANGE', 'low', 'Tab focus state changed to hidden.');
      } else {
        triggerViolation('TAB_FOCUS_CHANGE', 'low', 'Tab focus state returned to active.');
      }
    };

    const handleWindowBlur = () => {
      triggerViolation('TAB_NOT_FOCUS', 'low', 'Window lost active focus.');
      triggerViolation('TAB_FOCUS_CHANGE', 'low', 'Window blur event triggered.');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerViolation('EXIT_FULLSCREEN', 'critical', 'Candidate exited full screen mode.');
        triggerViolation('FULLSCREEN_CHANGE', 'medium', 'Full screen state changed to windowed.');
      } else {
        triggerViolation('FULLSCREEN_CHANGE', 'low', 'Full screen mode entered.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [triggerViolation]);

  const setupAudioMeter = useCallback((stream: MediaStream) => {
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
          triggerViolation('SOUND_DETECTED', 'medium', `Sound / voice spike detected: ${dB}dB`);
        }

        requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.error('Audio meter error:', err);
    }
  }, [triggerViolation]);

  const startVideoAndAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 15 },
        audio: true,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setupAudioMeter(stream);
    } catch (err) {
      console.error('Camera/Microphone access error:', err);
      triggerViolation('SUSPICIOUS_ACTIVITY', 'critical', 'Camera or microphone permission denied.');
    }
  }, [setupAudioMeter, triggerViolation]);

  const loadModels = useCallback(async () => {
    try {
      if (window.faceapi) {
        const MODEL_URL = '/models';
        await window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setIsModelsLoaded(true);
        setFaceStatus('Biometric AI Engaged. Camera Active.');
        startVideoAndAudio();
      }
    } catch (err) {
      console.error('Error loading face-api models:', err);
      setFaceStatus('Error loading AI models.');
    }
  }, [startVideoAndAudio]);

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
  }, [loadModels]);



  // Continuous Video Frame & Face Landmark Processing
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
            setFaceStatus('⚠️ FACE ABSENCE');
            triggerViolation('FACE_ABSENCE', 'medium', 'Candidate face missing from webcam frame.');
          } else if (detections.length > 1) {
            setFaceStatus('🚨 MULTIPLE FACES DETECTED');
            triggerViolation('MULTIPLE_FACE', 'critical', 'Multiple faces detected in webcam frame.');
          } else {
            const currentDescriptor = detections[0].descriptor;

            if (referenceDescriptorRef.current) {
              const distance = faceapi.euclideanDistance(referenceDescriptorRef.current, currentDescriptor);
              if (distance > 0.6) {
                setFaceStatus(`🚨 FACE MISMATCH (${(distance * 100).toFixed(0)}%)`);
                triggerViolation('SUSPICIOUS_ACTIVITY', 'critical', `Biometric face mismatch: distance ${distance.toFixed(2)}`);
              } else {
                setFaceStatus('✅ Identity Verified');
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

            const eyeLevelY = (leftEye[0].y + rightEye[0].y) / 2;
            const noseY = nose[3] ? nose[3].y : nose[0].y;
            const pitchDiff = noseY - eyeLevelY;

            if (yawRatio < 0.35 || yawRatio > 2.8) {
              setFaceStatus('⚠️ HEAD TURN DETECTED');
              triggerViolation('SUSPICIOUS_ACTIVITY', 'medium', 'Candidate turned face significantly sideways.');
            } else if (pitchDiff < 10 || pitchDiff > 45) {
              setFaceStatus('⚠️ GAZE DEVIATION');
              triggerViolation('SUSPICIOUS_ACTIVITY', 'medium', 'Candidate looking away from screen (up or down).');
            }
          }
        }
      }, 3000);
    }

    return () => clearInterval(intervalId);
  }, [isModelsLoaded, triggerViolation]);

  // Generate & Post Complete Exam Audit Report
  const generateAndSendReport = useCallback(async () => {
    const logs = evidenceLogsRef.current;
    const flagCounts = {
      faceAbsence: logs.filter((l) => l.eventType === 'FACE_ABSENCE').length,
      multipleFace: logs.filter((l) => l.eventType === 'MULTIPLE_FACE').length,
      soundDetected: logs.filter((l) => l.eventType === 'SOUND_DETECTED').length,
      tabFocusChange: logs.filter((l) => l.eventType === 'TAB_FOCUS_CHANGE' || l.eventType === 'TAB_NOT_FOCUS').length,
      fullscreenChange: logs.filter((l) => l.eventType === 'FULLSCREEN_CHANGE' || l.eventType === 'EXIT_FULLSCREEN').length,
      suspiciousActivity: logs.filter((l) => l.eventType === 'SUSPICIOUS_ACTIVITY').length,
    };

    const reportPayload = {
      reportId: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId: `${examId}-${candidateId}`,
      examId,
      candidateId,
      studentName,
      subject,
      tenantCode,
      completedAt: new Date().toISOString(),
      trustScore,
      totalViolations: logs.length,
      flagCounts,
      violations: logs,
    };

    console.log('[Proctor Widget] Generating complete audit report:', reportPayload);

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
  }, [examId, candidateId, studentName, subject, tenantCode, trustScore]);

  // Listen for parent SDK commands
  useEffect(() => {
    const handleParentMessage = (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === 'OMNIGUARD_PARENT_VIOLATION') {
        triggerViolation(
          event.data.eventType || 'SUSPICIOUS_ACTIVITY',
          event.data.severity || 'medium',
          event.data.detailsText || 'Host triggered violation'
        );
      } else if (event.data.type === 'OMNIGUARD_REQUEST_REPORT') {
        generateAndSendReport();
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [triggerViolation, generateAndSendReport]);

  return (
    <div style={{
      padding: '10px',
      color: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      height: '100%',
      boxSizing: 'border-box',
      background: '#090d16',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
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

      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', color: '#38bdf8' }}>PROCTOR WIDGET</span>
        </div>
        <div style={{
          fontSize: '0.65rem',
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

      {/* Video Container */}
      <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '8px', overflow: 'hidden', background: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <video
          ref={videoRef}
          width="320"
          height="160"
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas
          ref={canvasRef}
          width="320"
          height="160"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      </div>

      {/* Status Indicators */}
      <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#94a3b8' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
          Status: <strong style={{ color: '#ffffff' }}>{faceStatus}</strong>
        </span>
        <span>Mic: <strong style={{ color: audioDb > 68 ? '#f43f5e' : '#34d399' }}>{audioDb} dB</strong></span>
      </div>

      {/* Footer controls */}
      <div style={{ marginTop: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', color: '#64748b' }}>
        <span>Flags: <strong style={{ color: '#06b6d4' }}>{evidenceLogs.length}</strong></span>
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
    <Suspense fallback={<div style={{ color: '#fff', padding: '20px', background: '#090d16' }}>Loading Proctor Widget...</div>}>
      <ProctorContent />
    </Suspense>
  );
}
