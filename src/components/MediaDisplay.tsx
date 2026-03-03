// components/MediaDisplay.tsx
import React, { useEffect, useState } from "react";
import { getMedia } from "../lib/mediaStorage";
import { SlideElement } from "../store/editorStore";

interface MediaDisplayProps {
  element: SlideElement;
  className?: string;
  style?: React.CSSProperties;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({ element, className, style }) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

useEffect(() => {
  let objectUrl: string | null = null;

  const loadMedia = async () => {
    setLoading(true);
    setError(false);

    if (!element.content.startsWith('idb://')) {
      setMediaUrl(element.content);
      setLoading(false);
      return;
    }

    const mediaId = element.content.replace('idb://', '');

    try {
      const url = await getMedia(mediaId);
      if (url) {
        objectUrl = url;
        setMediaUrl(url);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error loading media:', err);
      setError(true);
    }

    setLoading(false);
  };

  loadMedia();

  return () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  };
}, [element.content]);

  if (loading) {
    return (
      <div className={className} style={style}>
        <div className="flex items-center justify-center h-full text-gray-400">
          Loading...
        </div>
      </div>
    );
  }

  if (error || !mediaUrl) {
    return (
      <div className={className} style={style}>
        <div className="flex items-center justify-center h-full text-red-500">
          Failed to load media
        </div>
      </div>
    );
  }

  if (element.kind === "image") {
    return (
      <img
        src={mediaUrl}
        alt="Slide media"
        className={className}
        style={style}
      />
    );
  }

  if (element.kind === "audio") {
    return (
      <audio
        controls
        src={mediaUrl}
        className={className}
        style={style}
      />
    );
  }

  if (element.kind === "video") {
    return (
      <video
        controls
        src={mediaUrl}
        className={className}
        style={style}
      />
    );
  }

  return null;
};

export default MediaDisplay;