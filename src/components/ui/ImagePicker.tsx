"use client";

import { useEffect, useRef, useState } from "react";
import { Button, cn } from "@/components/ui";

export const MAX_IMAGE_MB = 5;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

// Returns an error message, or null when the file is acceptable
export const validateImage = (file: File): string | null => {
  if (!ACCEPTED.includes(file.type)) return "Please choose a JPG, PNG or WebP image.";
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `Image must be under ${MAX_IMAGE_MB}MB.`;
  return null;
};

// A file chooser with a live preview. Selection is held by the parent through
// `onChange`; nothing is uploaded until the parent submits.
export const ImagePicker = ({
  label,
  current,
  file,
  onChange,
  shape = "square",
  placeholder,
  disabled,
}: {
  label: string;
  current?: string | null;
  file: File | null;
  onChange: (file: File | null) => void;
  shape?: "circle" | "square" | "banner";
  placeholder?: string;
  disabled?: boolean;
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handle = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    event.target.value = "";
    if (!next) return;

    const problem = validateImage(next);
    setError(problem);
    if (!problem) onChange(next);
  };

  const src = preview || current || null;

  const frame = {
    circle: "h-24 w-24 rounded-full",
    square: "h-24 w-24 rounded-xl",
    banner: "h-32 w-full rounded-xl sm:h-40",
  }[shape];

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-700">{label}</p>
      <div className={cn("flex gap-4", shape === "banner" ? "flex-col" : "items-center")}>
        <div
          className={cn(
            "grid shrink-0 place-items-center overflow-hidden border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400",
            frame,
          )}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={label} className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center">{placeholder || "No image"}</span>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              {src ? "Change" : "Upload"}
            </Button>
            {file && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setError(null);
                  onChange(null);
                }}
              >
                Discard
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-400">
            JPG, PNG or WebP, up to {MAX_IMAGE_MB}MB.
            {file && " Save to apply."}
          </p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={handle}
      />
    </div>
  );
};
