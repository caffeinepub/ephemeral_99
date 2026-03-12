import React, { useRef, useState, useEffect, useCallback } from "react";
import { ArrowLeft, Camera, SwitchCamera, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppStore } from "../hooks/useAppStore";
import { CameraErrorView } from "./CameraErrorView";
import {
  MAX_VIDEO_DURATION_MS,
  LONG_PRESS_THRESHOLD_MS,
  FILTER_PRESETS,
  getSupportedVideoMimeType,
} from "../utils/constants";

type CameraError = "permission-denied" | "not-found" | "not-supported" | null;

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${String(sec).padStart(2, "0")}`;
}

const RING_RADIUS = 34;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export function CameraCapture() {
  const { setCapturedMediaBlob, setView } = useAppStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<CameraError>(null);
  const [isStarting, setIsStarting] = useState(true);

  const [captureFilter, setCaptureFilter] = useState("normal");
  const [cameraCount, setCameraCount] = useState(0);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPressedRef = useRef(false);
  const recordingStartRef = useRef(0);
  const recordingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordingAnimFrameRef = useRef<number>(0);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (facing: "user" | "environment") => {
      stopStream();
      setIsStarting(true);
      setCameraError(null);

      const tryGetStream = async (
        facingConstraint: { exact: string } | string,
        audio: boolean,
      ) => {
        return navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingConstraint,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio,
        });
      };

      const setStream = (stream: MediaStream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsStarting(false);
      };

      try {
        // Try exact facing mode with audio
        const stream = await tryGetStream({ exact: facing }, true);
        setStream(stream);
      } catch {
        try {
          // Try exact facing mode without audio
          const stream = await tryGetStream({ exact: facing }, false);
          setStream(stream);
        } catch {
          try {
            // Fallback to ideal (non-exact) with audio
            const stream = await tryGetStream(facing, true);
            setStream(stream);
          } catch {
            try {
              // Fallback to ideal without audio
              const stream = await tryGetStream(facing, false);
              setStream(stream);
            } catch (finalErr) {
              setIsStarting(false);
              if (finalErr instanceof DOMException) {
                if (finalErr.name === "NotAllowedError") {
                  setCameraError("permission-denied");
                } else if (
                  finalErr.name === "NotFoundError" ||
                  finalErr.name === "OverconstrainedError"
                ) {
                  setCameraError("not-found");
                } else {
                  setCameraError("not-supported");
                }
              } else {
                setCameraError("not-supported");
              }
            }
          }
        }
      }
    },
    [stopStream],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await startCamera(facingMode);
      if (cancelled) {
        stopStream();
      }
    })();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, startCamera, stopStream]);

  // Count available cameras after stream starts (permissions must be granted first)
  useEffect(() => {
    if (!isStarting && !cameraError) {
      let cancelled = false;
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          if (!cancelled) {
            setCameraCount(
              devices.filter((d) => d.kind === "videoinput").length,
            );
          }
        })
        .catch(() => setCameraCount(0));
      return () => {
        cancelled = true;
      };
    }
  }, [isStarting, cameraError]);

  // Cleanup recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      if (recordingAnimFrameRef.current)
        cancelAnimationFrame(recordingAnimFrameRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setCapturedMediaBlob(blob);
          if (captureFilter !== "normal") {
            useAppStore.getState().setSelectedFilter(captureFilter);
          }
          setView("editor");
        }
      },
      "image/jpeg",
      0.92,
    );
  }, [facingMode, captureFilter, setCapturedMediaBlob, setView]);

  const stopRecording = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  const startRecording = useCallback(() => {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;

    const mimeType = getSupportedVideoMimeType();
    if (!mimeType) {
      toast.error("Video recording is not supported in this browser");
      return;
    }

    // Record through a canvas to ensure correct orientation on mobile.
    // The raw camera stream may be in landscape sensor orientation;
    // drawing it from the <video> element gives us the displayed (rotated) frames.
    const recCanvas = document.createElement("canvas");
    recCanvas.width = video.videoWidth;
    recCanvas.height = video.videoHeight;
    recordingCanvasRef.current = recCanvas;
    const ctx = recCanvas.getContext("2d");

    const isFront = facingMode === "user";

    const drawFrame = () => {
      if (ctx && video.readyState >= 2) {
        ctx.save();
        if (isFront) {
          ctx.translate(recCanvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, recCanvas.width, recCanvas.height);
        ctx.restore();
      }
      recordingAnimFrameRef.current = requestAnimationFrame(drawFrame);
    };

    // Combine canvas video track with original audio tracks
    const canvasStream = recCanvas.captureStream(30);
    const audioTracks = stream.getAudioTracks();
    const combinedStream =
      audioTracks.length > 0
        ? new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks])
        : canvasStream;

    recordingChunksRef.current = [];
    const recorder = new MediaRecorder(combinedStream, { mimeType });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        recordingChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      cancelAnimationFrame(recordingAnimFrameRef.current);
      recordingCanvasRef.current = null;
      const blobType = mimeType.startsWith("video/mp4")
        ? "video/mp4"
        : "video/webm";
      const blob = new Blob(recordingChunksRef.current, { type: blobType });
      if (blob.size > 0) {
        const { setCapturedMedia, setSelectedFilter, setView } =
          useAppStore.getState();
        setCapturedMedia(blob, "video");
        if (captureFilter !== "normal") {
          setSelectedFilter(captureFilter);
        }
        setView("editor");
      }
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    recordingAnimFrameRef.current = requestAnimationFrame(drawFrame);
    setIsRecording(true);
    setRecordingDuration(0);
    recordingStartRef.current = Date.now();

    recordingTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - recordingStartRef.current;
      setRecordingDuration(elapsed);
      if (elapsed >= MAX_VIDEO_DURATION_MS) {
        stopRecording();
      }
    }, 100);
  }, [facingMode, captureFilter, stopRecording]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isPressedRef.current = true;

      pressTimerRef.current = setTimeout(() => {
        if (isPressedRef.current) {
          startRecording();
        }
      }, LONG_PRESS_THRESHOLD_MS);
    },
    [startRecording],
  );

  const handlePointerUp = useCallback(() => {
    isPressedRef.current = false;

    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isRecording) {
      stopRecording();
    } else {
      handleCapture();
    }
  }, [isRecording, stopRecording, handleCapture]);

  const handlePointerCancel = useCallback(() => {
    isPressedRef.current = false;
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  const handleFlipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type.startsWith("video/")) {
        useAppStore.getState().setCapturedMedia(file, "video");
        setView("editor");
      } else {
        setCapturedMediaBlob(file);
        setView("editor");
      }
    },
    [setCapturedMediaBlob, setView],
  );

  const handleGalleryClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const hasCamera = !cameraError;
  const progressFraction = recordingDuration / MAX_VIDEO_DURATION_MS;
  const activePreset =
    FILTER_PRESETS.find((f) => f.name === captureFilter) ?? FILTER_PRESETS[0];

  return (
    <div className="relative flex flex-col items-center justify-center h-full min-h-[60vh] bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn(
          "w-full h-full object-cover absolute inset-0",
          facingMode === "user" && "-scale-x-100",
          (isStarting || cameraError) && "invisible",
        )}
        style={{ filter: activePreset.cssFilter }}
      />

      {isStarting && !cameraError && (
        <div className="text-white/60 text-sm">Starting camera...</div>
      )}

      {cameraError && (
        <CameraErrorView
          error={cameraError}
          onGalleryClick={handleGalleryClick}
        />
      )}

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,video/webm,video/mp4,video/quicktime"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Back button */}
      {!isRecording && (
        <div
          className="absolute top-4 left-4 z-10"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
            onClick={() => setView("inbox")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Recording timer badge */}
      {isRecording && (
        <div
          className="absolute top-4 inset-x-0 flex justify-center z-10"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-mono tabular-nums">
              {formatDuration(recordingDuration)}
            </span>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div
        className="absolute bottom-0 inset-x-0 pb-4 sm:pb-6 pt-8 sm:pt-12 bg-gradient-to-t from-black/60 to-transparent"
        style={{
          paddingBottom: "calc(env(safe-area-inset-bottom, 1rem) + 1rem)",
        }}
      >
        {/* Filter strip */}
        {hasCamera && !isStarting && !isRecording && (
          <div className="flex gap-2 flex-wrap px-4 py-2 justify-center">
            {FILTER_PRESETS.map((filter) => (
              <button
                key={filter.name}
                onClick={() => setCaptureFilter(filter.name)}
                className={cn(
                  "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  captureFilter === filter.name
                    ? "bg-white text-black"
                    : "bg-white/20 text-white",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-around px-6 sm:px-8">
          {!isRecording ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-12 w-12 rounded-full"
              onClick={handleGalleryClick}
            >
              <ImagePlus className="h-6 w-6" />
            </Button>
          ) : (
            <div className="h-12 w-12" />
          )}

          {/* Capture / record button */}
          <div className="relative flex items-center justify-center h-[72px] w-[72px]">
            {/* Progress ring */}
            {isRecording && (
              <svg
                className="absolute inset-0 h-full w-full -rotate-90 pointer-events-none"
                viewBox="0 0 72 72"
              >
                <circle
                  cx="36"
                  cy="36"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgba(239,68,68,0.3)"
                  strokeWidth="3"
                />
                <circle
                  cx="36"
                  cy="36"
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgb(239,68,68)"
                  strokeWidth="3"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={RING_CIRCUMFERENCE * (1 - progressFraction)}
                  strokeLinecap="round"
                />
              </svg>
            )}
            <button
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerCancel}
              onPointerCancel={handlePointerCancel}
              disabled={!hasCamera || isStarting}
              className={cn(
                "h-16 w-16 rounded-full border-4 flex items-center justify-center transition-all select-none touch-none",
                isRecording
                  ? "border-red-500 bg-red-500/20 scale-110"
                  : hasCamera && !isStarting
                    ? "border-white bg-white/20 hover:bg-white/30 active:scale-90"
                    : "border-white opacity-40 cursor-not-allowed",
              )}
            >
              {isRecording ? (
                <div className="h-6 w-6 rounded-sm bg-red-500" />
              ) : (
                <Camera className="h-8 w-8 text-white" />
              )}
            </button>
          </div>

          {!isRecording && cameraCount > 1 ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 h-12 w-12 rounded-full"
              onClick={handleFlipCamera}
              disabled={!hasCamera || isStarting}
            >
              <SwitchCamera className="h-6 w-6" />
            </Button>
          ) : (
            <div className="h-12 w-12" />
          )}
        </div>
      </div>
    </div>
  );
}
