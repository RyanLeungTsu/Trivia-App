// components/MediaDisplay.tsx
import React, { useEffect, useState } from "react";
import { getMedia, getMediaPublic } from "../lib/mediaStorage";
import { useAuthStore } from "../lib/authStore";
import { supabase } from "../lib/supabaseClient";
import { SlideElement } from "../store/editorStore";

interface MediaDisplayProps {
  element: SlideElement;
  className?: string;
  style?: React.CSSProperties;
}

const MediaDisplay: React.FC<MediaDisplayProps> = ({
  element,
  className,
  style,
}) => {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const objectUrl: string | null = null;

    const loadMedia = async () => {
      setLoading(true);
      setError(false);

      if (
        !element.content.startsWith("idb://") &&
        !element.content.startsWith("featured://")
      ) {
        setMediaUrl(element.content);
        setLoading(false);
        return;
      }

      try {
        let url: string | null = null;

        if (element.content.startsWith("featured://")) {
          const mediaId = element.content.replace("featured://", "");
          const { data } = supabase.storage
            .from("media")
            .getPublicUrl(`featured/${mediaId}`);
          url = data?.publicUrl ?? null;
        } else {
          const mediaId = element.content.replace("idb://", "");
          url = await getMedia(mediaId);
        }

        if (url) setMediaUrl(url);
        else setError(true);
      } catch (err) {
        console.error("Error loading media:", err);
        setError(true);
      }

      setLoading(false);
    };

    loadMedia();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [element.content,]);

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
      <audio controls src={mediaUrl} className={className} style={style} />
    );
  }

  if (element.kind === "video") {
    return (
      <video controls src={mediaUrl} className={className} style={style} />
    );
  }

  return null;
};

export default MediaDisplay;
