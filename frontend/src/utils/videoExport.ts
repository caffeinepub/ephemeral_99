import type { CropRegion, DrawingStroke, TextItem } from "./constants";
import { getSupportedVideoMimeType } from "./constants";
import { renderStrokesToCanvas, renderTextToCanvas } from "./canvasRendering";

export function extractVideoFrame(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    // Required for drawing to canvas on iOS
    video.crossOrigin = "anonymous";
    video.setAttribute("playsinline", "true");
    video.setAttribute("webkit-playsinline", "true");

    let resolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };

    const captureFrame = () => {
      if (resolved) return;
      if (!video.videoWidth || !video.videoHeight) return;
      resolved = true;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      cleanup();

      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load extracted frame"));
      img.src = dataUrl;
    };

    video.onseeked = captureFrame;

    video.onloadeddata = () => {
      // Seek to a small non-zero time — seeking to 0 when already at 0
      // doesn't trigger onseeked on some mobile browsers
      video.currentTime = 0.001;

      // Fallback: if onseeked doesn't fire within 500ms, try capturing directly
      setTimeout(() => {
        if (!resolved && video.readyState >= 2) {
          captureFrame();
        }
      }, 500);
    };

    // Additional fallback: try to play briefly then capture
    video.oncanplay = () => {
      if (resolved) return;
      // On mobile Safari, playing the video may be needed before drawing works
      const playPromise = video.play();
      if (playPromise) {
        playPromise
          .then(() => {
            setTimeout(() => {
              video.pause();
              captureFrame();
            }, 100);
          })
          .catch(() => {
            // Autoplay blocked — rely on seek-based capture
          });
      }
    };

    video.onerror = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      reject(new Error("Failed to load video for frame extraction"));
    };

    video.src = url;
  });
}

export interface VideoExportOptions {
  sourceBlob: Blob;
  cssFilter: string;
  strokes: DrawingStroke[];
  textItems: TextItem[];
  displayWidth: number;
  onProgress: (percent: number) => void;
  crop?: CropRegion | null;
}

export function exportEditedVideo(options: VideoExportOptions): Promise<Blob> {
  const {
    sourceBlob,
    cssFilter,
    strokes,
    textItems,
    displayWidth,
    onProgress,
    crop,
  } = options;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(sourceBlob);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    // Secondary video for audio capture
    let audioUrl: string | null = null;
    let audioVideo: HTMLVideoElement | null = null;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioVideo) {
        audioVideo.removeAttribute("src");
        audioVideo.load();
        audioVideo = null;
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video for export"));
    };

    video.onloadedmetadata = async () => {
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) {
        cleanup();
        reject(new Error("Video has no dimensions"));
        return;
      }

      const hasCrop =
        crop != null &&
        !(crop.x === 0 && crop.y === 0 && crop.w === 1 && crop.h === 1);

      const outWidth = hasCrop ? Math.round(crop!.w * width) : width;
      const outHeight = hasCrop ? Math.round(crop!.h * height) : height;

      const canvas = document.createElement("canvas");
      canvas.width = outWidth;
      canvas.height = outHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Could not get canvas context"));
        return;
      }

      const scaleFactor = displayWidth > 0 ? outWidth / displayWidth : 1;
      const hasEdits =
        cssFilter !== "none" ||
        strokes.length > 0 ||
        textItems.length > 0 ||
        hasCrop;

      // If no edits, just pass through the original blob
      if (!hasEdits) {
        cleanup();
        resolve(sourceBlob);
        return;
      }

      const mimeType = getSupportedVideoMimeType();
      if (!mimeType) {
        cleanup();
        reject(new Error("Video recording is not supported in this browser"));
        return;
      }

      // Get canvas video stream
      const canvasStream = canvas.captureStream(30);

      // Try to capture audio from the source video
      let combinedStream: MediaStream;
      try {
        audioUrl = URL.createObjectURL(sourceBlob);
        audioVideo = document.createElement("video");
        audioVideo.playsInline = true;
        audioVideo.preload = "auto";
        audioVideo.src = audioUrl;

        await new Promise<void>((res, rej) => {
          audioVideo!.onloadedmetadata = () => res();
          audioVideo!.onerror = () => rej(new Error("Audio load failed"));
        });

        // captureStream is non-standard (Chrome/Firefox only, not in TS types)
        const captureStreamFn = (
          audioVideo as unknown as Record<string, unknown>
        ).captureStream as (() => MediaStream) | undefined;
        if (typeof captureStreamFn === "function") {
          await audioVideo.play();
          const audioStream = captureStreamFn.call(audioVideo);
          const audioTracks = audioStream.getAudioTracks();
          if (audioTracks.length > 0) {
            combinedStream = new MediaStream([
              ...canvasStream.getVideoTracks(),
              ...audioTracks,
            ]);
          } else {
            combinedStream = canvasStream;
          }
        } else {
          combinedStream = canvasStream;
        }
      } catch {
        // Audio capture failed — proceed without audio
        combinedStream = canvasStream;
      }

      const recorder = new MediaRecorder(combinedStream, { mimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blobType = mimeType.startsWith("video/mp4")
          ? "video/mp4"
          : "video/webm";
        const result = new Blob(chunks, { type: blobType });
        cleanup();
        resolve(result);
      };

      recorder.onerror = () => {
        cleanup();
        reject(new Error("MediaRecorder error during video export"));
      };

      // Start recording
      recorder.start(1000);

      // Render loop
      let animFrameId: number;

      const renderFrame = () => {
        if (video.ended || video.paused) {
          return;
        }

        ctx.filter = cssFilter;
        if (hasCrop) {
          const sx = Math.round(crop!.x * width);
          const sy = Math.round(crop!.y * height);
          ctx.drawImage(
            video,
            sx,
            sy,
            outWidth,
            outHeight,
            0,
            0,
            outWidth,
            outHeight,
          );
        } else {
          ctx.drawImage(video, 0, 0);
        }
        ctx.filter = "none";

        renderStrokesToCanvas(ctx, strokes, outWidth, outHeight, scaleFactor);
        renderTextToCanvas(ctx, textItems, outWidth, outHeight, scaleFactor);

        if (video.duration) {
          onProgress((video.currentTime / video.duration) * 100);
        }

        animFrameId = requestAnimationFrame(renderFrame);
      };

      video.onended = () => {
        cancelAnimationFrame(animFrameId);
        onProgress(100);
        // Stop audio playback
        if (audioVideo) {
          audioVideo.pause();
        }
        recorder.stop();
      };

      // Start playback (unmuted so audio can be captured)
      video.muted = false;
      try {
        await video.play();
      } catch {
        // Autoplay may be blocked — try muted
        video.muted = true;
        await video.play();
      }
      animFrameId = requestAnimationFrame(renderFrame);
    };

    video.src = url;
  });
}
