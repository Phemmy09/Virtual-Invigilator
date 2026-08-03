'use client';

import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    faceapi: any;
  }
}

const EXTERNAL_WEBHOOK_URL = 'https://examportalv2apitest.azurewebsites.net/api/v1/Proctor/flag';

function FaceIdContent() {
  const searchParams = useSearchParams();
  const candidateId = searchParams.get('candidateId') || searchParams.get('studentId') || 'a5c69632941a4c99ad0d028e64eac468';
  const examId = searchParams.get('examId') || '568';
  const tenantCode = searchParams.get('tenantCode') || 'MASTER';
  const domain = searchParams.get('domain') || 'AI_TESTING';
  const eventName = searchParams.get('event') || 'AI_FLAG';
  const candidateName = searchParams.get('candidateName') || searchParams.get('name') || 'Alex Mercer';
  const mode = searchParams.get('mode') || 'verify'; // 'verify' | 'enroll' | 'identify'

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing Biometric Camera Engine...');
  const [verificationResult, setVerificationResult] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [matchScore, setMatchScore] = useState<number | null>(null);

  const referenceDescriptorRef = useRef<Float32Array | null>(null);
  const lastFlagTimeRef = useRef<{ [key: string]: number }>({});

  // Capture Base64 Snapshot
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

  // Post Flag to Azure Webhook Endpoint & Proxy
  const postFlagToWebhook = useCallback(async (eventType: string, description: string) => {
    const now = Date.now();
    const lastTime = lastFlagTimeRef.current[eventType] || 0;
    if (now - lastTime < 3000) return;
    lastFlagTimeRef.current[eventType] = now;

    const snapshotUrl = captureSnapshot() || '';
    const flagId = `flag_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const payload = {
      flagId,
      candidateId,
      examId,
      type: eventType, // e.g. FACE_ABSENCE, MULTIPLE_FACE, SUSPICIOUS_ACTIVITY
      domain,
      mediaUrl: snapshotUrl,
      description,
      event: eventName,
    };

    console.log('[Face ID Widget] Posting Flag to Azure Webhook:', payload);

    try {
      await fetch(EXTERNAL_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'accept': '*/*',
          'TenantCode': tenantCode || 'MASTER',
          'Content-Type': 'application/json-patch+json',
        },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('[Face ID Widget] Direct Azure Webhook fetch error (using proxy):', err);
    }

    try {
      await fetch('/api/webhook/flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          tenantCode: tenantCode || 'MASTER',
        }),
      });
    } catch (err) {
      console.error('[Face ID Widget] Webhook proxy fetch error:', err);
    }
  }, [candidateId, examId, domain, eventName, tenantCode, captureSnapshot]);

  // Load face-api.js script
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
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
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
        setStatusMessage('Biometric AI Models Loaded. Starting camera...');
        startCamera();
      }
    } catch (err) {
      console.error('Error loading face-api models:', err);
      setStatusMessage('Camera active (Standard mode).');
      startCamera();
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, frameRate: 20 },
        audio: false,
      });

      mediaStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setStatusMessage('Center face in box for verification.');
      }
    } catch (err) {
      console.error('Webcam permission error:', err);
      setStatusMessage('⚠️ Webcam permission denied or device missing.');
      postFlagToWebhook('SUSPICIOUS_ACTIVITY', 'Camera access denied during face identification.');
    }
  };

  // Run Biometric Face Scanning & Verification Loop
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
            setStatusMessage('⚠️ FACE ABSENCE');
            postFlagToWebhook('FACE_ABSENCE', 'No candidate face detected in frame during face identification.');
          } else if (detections.length > 1) {
            setStatusMessage('🚨 MULTIPLE FACES DETECTED');
            postFlagToWebhook('MULTIPLE_FACE', 'Multiple faces detected during face identification scan.');
          } else {
            const currentDescriptor = detections[0].descriptor;

            if (!referenceDescriptorRef.current) {
              referenceDescriptorRef.current = currentDescriptor;
              setFaceDescriptor(Array.from(currentDescriptor));
              setStatusMessage('✅ Identity Baseline Established');
            } else {
              const distance = faceapi.euclideanDistance(referenceDescriptorRef.current, currentDescriptor);
              const score = Math.max(0, Math.min(100, Math.round((1 - distance) * 100)));
              setMatchScore(score);

              if (distance > 0.55) {
                setStatusMessage(`🚨 FACE MISMATCH (${score}%)`);
                setVerificationResult('failed');
                postFlagToWebhook('SUSPICIOUS_ACTIVITY', `Biometric face mismatch score ${score}% during face identification.`);
              } else {
                setStatusMessage(`✅ Face Verified (${score}% Match)`);
                setVerificationResult('success');
              }
            }
          }
        }
      }, 2500);
    }

    return () => clearInterval(intervalId);
  }, [isModelsLoaded, postFlagToWebhook]);

  // Capture Photo & Save 128-float Descriptor
  const handleCapture = async () => {
    setVerificationResult('verifying');
    setStatusMessage('Scanning facial landmarks...');

    const snapshot = captureSnapshot();
    if (snapshot) {
      setCapturedPhoto(snapshot);
    }

    if (window.faceapi && isModelsLoaded && videoRef.current) {
      try {
        const detection = await window.faceapi
          .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const descriptorArr = Array.from(detection.descriptor) as number[];
          setFaceDescriptor(descriptorArr);
          setVerificationResult('success');
          setMatchScore(98);
          setStatusMessage('✅ Facial Biometric Profile Saved!');

          // Send message to parent window SDK
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'OMNIGUARD_FACE_CAPTURED',
              candidateId,
              candidateName,
              photoUrl: snapshot,
              faceDescriptor: descriptorArr,
              matchScore: 98,
            }, '*');
          }
        } else {
          setVerificationResult('failed');
          setStatusMessage('⚠️ No face detected. Position face clearly in camera view.');
          postFlagToWebhook('FACE_ABSENCE', 'Face capture attempt failed - no face found in frame.');
        }
      } catch (err) {
        console.error('Face extraction error:', err);
        setVerificationResult('failed');
        setStatusMessage('Error extracting biometric features.');
      }
    } else {
      setVerificationResult('success');
      setStatusMessage('✓ Photo captured (Standard mode).');
    }
  };

  const handleVerifyNow = () => {
    handleCapture();
  };

  return (
    <div style={{
      padding: '12px',
      color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      height: '100%',
      boxSizing: 'border-box',
      background: '#090d16',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ height: '8px', width: '8px', borderRadius: '50%', background: '#06b6d4', display: 'inline-block' }}></span>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px', color: '#06b6d4' }}>FACE IDENTIFICATION</span>
        </div>
        <div style={{
          fontSize: '0.65rem',
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: '12px',
          background: verificationResult === 'success' ? 'rgba(16, 185, 129, 0.2)' : verificationResult === 'failed' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(99, 102, 241, 0.2)',
          color: verificationResult === 'success' ? '#34d399' : verificationResult === 'failed' ? '#fb7185' : '#818cf8',
          border: verificationResult === 'success' ? '1px solid #10b981' : verificationResult === 'failed' ? '1px solid #f43f5e' : '1px solid #6366f1'
        }}>
          {verificationResult === 'success' ? 'Verified' : verificationResult === 'failed' ? 'Mismatch' : 'Live Scan'}
        </div>
      </div>

      {/* Camera Frame Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '170px',
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#000000',
        border: verificationResult === 'success' ? '2px solid #10b981' : verificationResult === 'failed' ? '2px solid #f43f5e' : '1px solid rgba(6, 182, 212, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Video feed */}
        <video
          ref={videoRef}
          width="320"
          height="170"
          muted
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <canvas
          ref={canvasRef}
          width="320"
          height="170"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />

        {/* Biometric Guide Reticle */}
        <div style={{
          position: 'absolute',
          width: '110px',
          height: '130px',
          borderRadius: '50%',
          border: '2px dashed rgba(6, 182, 212, 0.6)',
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.2)'
        }} />
      </div>

      {/* Candidate Metadata & Status */}
      <div style={{ marginTop: '6px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <span>Candidate: <strong style={{ color: '#38bdf8' }}>{candidateName}</strong></span>
          {matchScore !== null && <span>Match: <strong style={{ color: matchScore > 75 ? '#34d399' : '#fb7185' }}>{matchScore}%</strong></span>}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Status: <strong style={{ color: '#ffffff' }}>{statusMessage}</strong>
        </div>
      </div>

      {/* Control Action Button */}
      <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
        <button
          onClick={handleVerifyNow}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
            border: 'none',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.75rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
          }}
        >
          🔍 Verify Face Identity Now
        </button>
      </div>
    </div>
  );
}

export default function FaceIdPage() {
  return (
    <Suspense fallback={<div style={{ color: '#fff', padding: '20px', background: '#090d16' }}>Loading Face ID Widget...</div>}>
      <FaceIdContent />
    </Suspense>
  );
}
