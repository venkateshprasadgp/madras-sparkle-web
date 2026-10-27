"use client";

import { useCallback, useEffect, useState } from "react";
import { PHOTO_STORAGE_KEY } from "./photo";

/**
 * Holds the visitor's uploaded photograph only in React state and sessionStorage.
 * The photo is never uploaded to Supabase Storage; `clear` wipes every copy at once.
 */
export function usePhotoBuffer() {
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    setPhoto(sessionStorage.getItem(PHOTO_STORAGE_KEY));
  }, []);

  const save = useCallback((dataUrl: string) => {
    setPhoto(dataUrl);
    try {
      sessionStorage.setItem(PHOTO_STORAGE_KEY, dataUrl);
    } catch {
      // Storage quota exceeded: keep the photo in memory only.
    }
  }, []);

  const clear = useCallback(() => {
    setPhoto(null);
    sessionStorage.removeItem(PHOTO_STORAGE_KEY);
  }, []);

  return { photo, save, clear };
}
