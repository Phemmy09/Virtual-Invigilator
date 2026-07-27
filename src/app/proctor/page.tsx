'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    faceapi: any;
    webkitAudioContext: typeof AudioContext;
  }
}

function ProctorContent() {
  const searchParams = useSearchParams();
  const examId = searchParams.get('examId') || 'demo-exam';
  const studentId = searchParams.get('studentId') || 'demo-student';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [faceStatus, setFaceStatus] = useState<string>('Initializing Biometric Camera...');
  const [audioDb, setAudioDb] = useState<number>(0);
  const [trustScore, setTrustScore] = useState<number>(100);
  const [activeWarning, setActiveWarning] = useState<string | null>(null);

  const referenceDescriptorRef = useRef<Float32Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const triggerViolation = useCallback(async (eventType: string, severity: string, detailsText: string) => {
    const warningText = `SECURITY WARNING: ${eventType.replace('_', ' ').toUpperCase()} (${detailsText}). This irregularity has been logged to your institutional audit record.`;
    setActiveWarning(warningText);

    setTimeout(() => {
      setActiveWarning(null);
    }, 5000);

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `${examId}-${studentId}`,
          eventType,
          severity,
          details: { detailsText, audioDb },
        }),
      });
      const data = await res.json();
      if (data.currentTrustScore !== undefined) {
        setTrustScore(data.currentTrustScore);
      }
    } catch (err) {
      console.error('Failed to log violation:', err);
    }
  }, [examId, studentId, audioDb]);

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
        setFaceStatus('Biometric AI Engaged. Start Video Stream.');
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

        if (dB > 65) {
          triggerViolation('noise_spike', 'medium', `Loud ambient sound detected: ${dB}dB`);
        }

        requestAnimationFrame(checkAudio);
      };

      checkAudio();
    } catch (err) {
      console.error('Audio meter initialization error:', err);
    }
  };

  // Continuous Video Frame Processing
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
            triggerViolation('no_face', 'medium', 'Student turned away or face is out of camera view.');
          } else if (detections.length > 1) {
            setFaceStatus('🚨 MULTIPLE FACES DETECTED');
            triggerViolation('multiple_faces', 'critical', 'Multiple individuals detected in webcam frame.');
          } else {
            const currentDescriptor = detections[0].descriptor;

            if (referenceDescriptorRef.current) {
              const distance = faceapi.euclideanDistance(referenceDescriptorRef.current, currentDescriptor);
              if (distance > 0.6) {
                setFaceStatus(`🚨 FACE MISMATCH (${(distance * 100).toFixed(0)}%)`);
                triggerViolation('face_mismatch', 'critical', `Facial embedding mismatch distance: ${distance.toFixed(2)}`);
              } else {
                setFaceStatus('✅ Identity Verified (100%)');
              }
            } else {
              referenceDescriptorRef.current = currentDescriptor;
              setFaceStatus('✅ Reference Baseline Established');
            }

            const landmarks = detections[0].landmarks;
            const nose = landmarks.getNose();
            const leftEye = landmarks.getLeftEye();
            const rightEye = landmarks.getRightEye();

            const eyeDistLeft = Math.abs(nose[0].x - leftEye[0].x);
            const eyeDistRight = Math.abs(nose[0].x - rightEye[0].x);
            const yawRatio = eyeDistLeft / (eyeDistRight || 1);

            if (yawRatio < 0.4 || yawRatio > 2.5) {
              triggerViolation('gaze_deviation', 'low', 'Student looking significantly off-screen.');
            }
          }
        }
      }, 4000);
    }

    return () => clearInterval(intervalId);
  }, [isModelsLoaded]);

  // Listen for parent SDK messages
  useEffect(() => {
    const handleParentMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OMNIGUARD_PARENT_VIOLATION') {
        triggerViolation(event.data.eventType, event.data.severity, event.data.detailsText);
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [triggerViolation]);

  return (
    <div style={{ padding: '12px', color: '#f8fafc', fontFamily: 'sans-serif', position: 'relative' }}>
      {activeWarning && (
        <div className="pulse-warning" style={{
          position: 'absolute',
          top: '5px',
          left: '5px',
          right: '5px',
          zIndex: 99,
          background: 'rgba(244, 63, 94, 0.95)',
          color: '#ffffff',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(244, 63, 94, 0.5)'
        }}>
          {activeWarning}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px' }}>OMNIGUARD AI</span>
        </div>
        <div className={`badge-status ${trustScore > 75 ? 'badge-green' : trustScore > 50 ? 'badge-yellow' : 'badge-red'}`}>
          Trust Index: {trustScore}%
        </div>
      </div>

      <div style={{ position: 'relative', width: '316px', height: '170px', borderRadius: '10px', overflow: 'hidden', background: '#000000', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <video
          ref={videoRef}
          width="316"
          height="170"
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas
          ref={canvasRef}
          width="316"
          height="170"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      </div>

      <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
        <span>Status: <strong style={{ color: '#ffffff' }}>{faceStatus}</strong></span>
        <span>Mic: <strong style={{ color: audioDb > 65 ? '#f43f5e' : '#34d399' }}>{audioDb} dB</strong></span>
      </div>
    </div>
  );
}

export default function ProctorPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: '20px' }}>Loading Biometric Proctor...</div>}>
      <ProctorContent />
    </Suspense>
  );
}
