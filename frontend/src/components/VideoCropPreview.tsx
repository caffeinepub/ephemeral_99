import { useEffect, useState } from "react";
import { type CropRegion } from "../utils/constants";

interface VideoCropPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  src: string;
  cssFilter: string;
  crop: CropRegion | null;
}

export function VideoCropPreview({
  videoRef,
  src,
  cssFilter,
  crop,
}: VideoCropPreviewProps) {
  const [videoDims, setVideoDims] = useState<{
    w: number;
    h: number;
  } | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () =>
      setVideoDims({ w: video.videoWidth, h: video.videoHeight });
    video.addEventListener("loadedmetadata", onMeta);
    if (video.videoWidth) onMeta();
    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, [videoRef, src]);

  const hasCrop =
    crop != null &&
    !(crop.x === 0 && crop.y === 0 && crop.w === 1 && crop.h === 1);

  if (!hasCrop) {
    return (
      <video
        ref={videoRef}
        src={src}
        loop
        autoPlay
        playsInline
        muted
        className="block max-w-full max-h-[60vh] rounded-lg"
        style={{ filter: cssFilter }}
      />
    );
  }

  // Compute the cropped aspect ratio from original video dims
  const origW = videoDims?.w ?? 1;
  const origH = videoDims?.h ?? 1;
  const cropPxW = crop.w * origW;
  const cropPxH = crop.h * origH;
  const croppedAR = cropPxW / cropPxH;

  // Scale: the video needs to be 1/crop.w times wider and 1/crop.h times taller
  // than the container so the cropped region fills it exactly.
  const scaleX = 100 / crop.w;
  const scaleY = 100 / crop.h;

  // Position: offset so the crop region's top-left aligns with container's top-left
  const posX = crop.w === 1 ? 0 : (crop.x / (1 - crop.w)) * 100;
  const posY = crop.h === 1 ? 0 : (crop.y / (1 - crop.h)) * 100;

  return (
    <div
      className="overflow-hidden rounded-lg max-w-full max-h-[60vh]"
      style={{ aspectRatio: croppedAR }}
    >
      <video
        ref={videoRef}
        src={src}
        loop
        autoPlay
        playsInline
        muted
        className="block"
        style={{
          filter: cssFilter,
          width: `${scaleX}%`,
          height: `${scaleY}%`,
          objectFit: "cover",
          objectPosition: `${posX}% ${posY}%`,
        }}
      />
    </div>
  );
}
