import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Camera,
  Video,
  VideoOff,
  Users,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Cpu,
  Clock,
  Radio,
} from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

export default function CameraModal({ room, onClose, onOccupancyChange }) {
  const { loadAllData, showToast } = useApp();

  const videoRef = useRef(null);
  const hiddenCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);
  const isDetectingRef = useRef(false);
  const lastSaveTimeRef = useRef(0);

  // Camera & Detection state
  const [cameraStatus, setCameraStatus] = useState('Connecting'); // 'Connecting' | 'Live' | 'Permission Denied' | 'Unavailable'
  const [errorMessage, setErrorMessage] = useState(null);
  const [detectedCount, setDetectedCount] = useState(room?.estimated_occupancy || 0);
  const [confidence, setConfidence] = useState(null);
  const [inferenceMs, setInferenceMs] = useState(null);
  const [detections, setDetections] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  const capacity = room?.capacity || 60;
  const rawPct = Math.round((detectedCount / capacity) * 100);
  const displayPct = Math.min(100, rawPct);
  const isOverCapacity = detectedCount > capacity;

  // Occupancy classification
  const getOccupancyStatus = (pct, count) => {
    if (isOverCapacity) return { label: 'Over Capacity', color: 'bg-purple-100 text-purple-800 border-purple-300' };
    if (count === 0) return { label: 'Empty Room', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    if (pct < 70) return { label: 'Normal / Available', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (pct < 90) return { label: 'Nearly Full', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    return { label: 'Full', color: 'bg-red-100 text-red-800 border-red-300' };
  };

  const occupancyMeta = getOccupancyStatus(displayPct, detectedCount);

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping video track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Close camera and clean up session
  const handleClose = useCallback(() => {
    stopCameraStream();
    if (room?.id) {
      api.closeVisionSession(room.id).catch(() => null);
    }
    onClose();
  }, [stopCameraStream, room?.id, onClose]);

  // Request browser webcam
  useEffect(() => {
    isMountedRef.current = true;
    setCameraStatus('Connecting');
    setErrorMessage(null);

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access API is not supported in this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (!isMountedRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (isMountedRef.current) {
              videoRef.current.play().catch(console.warn);
              setCameraStatus('Live');
            }
          };
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        console.error('Camera access error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraStatus('Permission Denied');
          setErrorMessage('Camera permission was denied. Please allow camera access in browser settings to monitor this room.');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          setCameraStatus('Unavailable');
          setErrorMessage('No camera hardware found on this device.');
        } else {
          setCameraStatus('Unavailable');
          setErrorMessage(err.message || 'Unable to start camera.');
        }
      }
    }

    initCamera();

    return () => {
      isMountedRef.current = false;
      stopCameraStream();
      if (room?.id) {
        api.closeVisionSession(room.id).catch(() => null);
      }
    };
  }, [room?.id, stopCameraStream]);

  // Draw bounding boxes on overlay canvas
  const drawDetections = useCallback((dets, videoEl, overlayCanvas) => {
    if (!overlayCanvas || !videoEl) return;
    const ctx = overlayCanvas.getContext('2d');
    if (!ctx) return;

    overlayCanvas.width = videoEl.videoWidth || 640;
    overlayCanvas.height = videoEl.videoHeight || 480;
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    dets.forEach((det, idx) => {
      const [x1, y1, x2, y2] = det.bbox || [0, 0, 0, 0];
      const width = x2 - x1;
      const height = y2 - y1;
      const conf = det.confidence ? Math.round(det.confidence * 100) : null;
      const trackId = det.track_id;

      // Draw bounding box
      ctx.strokeStyle = '#10b981'; // Emerald 500
      ctx.lineWidth = 3;
      ctx.strokeRect(x1, y1, width, height);

      // Label
      const labelText = trackId !== null && trackId !== undefined
        ? `Person #${trackId} (${conf}%)`
        : `Person ${idx + 1} (${conf}%)`;

      ctx.font = 'bold 12px monospace';
      const textWidth = ctx.measureText(labelText).width;
      const textHeight = 16;

      ctx.fillStyle = '#059669'; // Emerald 600 background
      ctx.fillRect(x1, Math.max(0, y1 - textHeight - 4), textWidth + 8, textHeight + 4);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, x1 + 4, Math.max(textHeight, y1 - 4));
    });
  }, []);

  // Frame detection loop (every 300ms ~ 3.3 FPS)
  useEffect(() => {
    if (cameraStatus !== 'Live') return;

    const intervalId = setInterval(async () => {
      if (!isMountedRef.current || isDetectingRef.current) return;
      const video = videoRef.current;
      const canvas = hiddenCanvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      isDetectingRef.current = true;

      try {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);

        // Call backend YOLOv8 detection
        const res = await api.detectVisionFrame({
          image: dataUrl,
          room_id: room.id,
          room_code: room.room_code,
        });

        if (isMountedRef.current && res.success) {
          const count = res.people_count ?? 0;
          setDetectedCount(count);
          setConfidence(res.confidence);
          setInferenceMs(res.inference_ms);
          setDetections(res.detections || []);

          if (onOccupancyChange) {
            onOccupancyChange(room.id, count, res.confidence);
          }

          // Draw boxes on overlay
          drawDetections(res.detections || [], video, overlayCanvasRef.current);

          // Save periodic reading to Supabase every 6 seconds if count is stable
          const now = Date.now();
          if (now - lastSaveTimeRef.current >= 6000) {
            lastSaveTimeRef.current = now;
            api.recordVisionReading({
              room_id: room.id,
              estimated_occupancy: count,
              confidence: res.confidence,
              power_watts: room.latest_reading?.power_watts || room.power_consumption_w || 150,
              ac_on: room.latest_reading?.ac_on ?? (room.ac_status === 'ON'),
              lights_on: room.latest_reading?.lights_on ?? (room.lights_status === 'ON'),
              projector_on: room.latest_reading?.projector_on ?? (room.projector_status === 'ON'),
            }).then(() => {
              if (isMountedRef.current) {
                setLastSavedTime(new Date().toLocaleTimeString());
              }
            }).catch(console.warn);
          }
        }
      } catch (err) {
        console.warn('Detection tick failed:', err.message);
      } finally {
        isDetectingRef.current = false;
      }
    }, 300);

    return () => clearInterval(intervalId);
  }, [cameraStatus, room, drawDetections, onOccupancyChange]);

  // Manual save reading button
  const handleManualSave = async () => {
    setIsSaving(true);
    try {
      await api.recordVisionReading({
        room_id: room.id,
        estimated_occupancy: detectedCount,
        confidence,
        power_watts: room.latest_reading?.power_watts || room.power_consumption_w || 150,
        ac_on: room.latest_reading?.ac_on ?? (room.ac_status === 'ON'),
        lights_on: room.latest_reading?.lights_on ?? (room.lights_status === 'ON'),
        projector_on: room.latest_reading?.projector_on ?? (room.projector_status === 'ON'),
      });
      setLastSavedTime(new Date().toLocaleTimeString());
      if (showToast) {
        showToast(`Occupancy (${detectedCount} people) saved to Supabase database.`, 'success');
      }
      loadAllData(true);
    } catch (err) {
      if (showToast) {
        showToast(`Save failed: ${err.message}`, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/90 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-md">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  {room?.room_code} Live Camera Feed
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${occupancyMeta.color}`}>
                  {occupancyMeta.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {room?.building} • Floor {room?.floor} • Nominal Capacity: {capacity}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Camera"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport Area */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            {/* The Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${cameraStatus === 'Live' ? 'block' : 'hidden'}`}
            />

            {/* Bounding Box Canvas Overlay */}
            <canvas
              ref={overlayRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${cameraStatus === 'Live' ? 'block' : 'hidden'}`}
            />

            {/* Hidden capture canvas */}
            <canvas ref={hiddenCanvasRef} className="hidden" />

            {/* Fallback & Loading States */}
            {cameraStatus === 'Connecting' && (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-300">Requesting camera access...</p>
                <p className="text-xs text-slate-500">Please grant browser permission when prompted</p>
              </div>
            )}

            {cameraStatus === 'Permission Denied' && (
              <div className="text-center p-6 max-w-md space-y-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
                  <VideoOff className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Camera Permission Denied</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {cameraStatus === 'Unavailable' && (
              <div className="text-center p-6 max-w-md space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Camera Unavailable</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {/* Top Video HUD Overlays (when Live) */}
            {cameraStatus === 'Live' && (
              <>
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-xs font-semibold text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>YOLOv8 Edge Vision Live</span>
                  </div>
                  {inferenceMs !== null && (
                    <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-mono text-slate-300">
                      <Cpu className="w-3 h-3 text-slate-400" />
                      <span>{inferenceMs} ms</span>
                    </div>
                  )}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-xs font-bold text-white">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{detectedCount} Detected</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Occupancy KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                People Count
              </span>
              <p className="text-2xl font-black text-white mt-0.5">
                {detectedCount}{' '}
                <span className="text-xs font-normal text-slate-500">/ {capacity}</span>
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Occupancy %
              </span>
              <p className={`text-2xl font-black mt-0.5 ${isOverCapacity ? 'text-purple-400' : 'text-emerald-400'}`}>
                {displayPct}%
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                YOLOv8 Confidence
              </span>
              <p className="text-lg font-bold text-slate-200 mt-1 font-mono">
                {confidence ? `${Math.round(confidence * 100)}%` : detectedCount > 0 ? 'Tracking' : 'Empty'}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Smoothing / Tracking
              </span>
              <p className="text-xs font-bold text-emerald-400 mt-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ByteTrack Active
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Classroom Occupancy Capacity</span>
              <span className="font-mono text-slate-300">
                {detectedCount} of {capacity} seats filled
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isOverCapacity
                    ? 'bg-purple-500'
                    : displayPct > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(2, displayPct))}%` }}
              />
            </div>
          </div>

          {/* Privacy & Ethics Note */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong>Privacy Protection:</strong> YOLOv8 optical inference performs bounding-box person headcount only. No facial recognition, identity indexing, or biometric logging is performed.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {lastSavedTime ? (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Last saved to Supabase: {lastSavedTime}
              </span>
            ) : (
              <span>Periodic telemetry auto-syncing to Supabase (6s interval)</span>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleManualSave}
              disabled={isSaving || cameraStatus !== 'Live'}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSaving ? 'Saving...' : 'Sync Reading Now'}</span>
            </button>

            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <VideoOff className="w-3.5 h-3.5" />
              <span>Close Camera</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
