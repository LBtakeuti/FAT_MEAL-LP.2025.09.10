'use client';

import { presetToUrl, type ReviewIconPreset } from '@/types/review';

interface Props {
  url: string | null;
  preset: ReviewIconPreset | null;
  name: string;
  size?: number;
}

export function ReviewAvatar({ url, preset, name, size = 48 }: Props) {
  const src = url || (preset ? presetToUrl(preset) : null);
  if (!src) {
    return (
      <div
        className="rounded-full bg-gray-200 flex-shrink-0"
        style={{ width: size, height: size }}
        aria-label={name}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size }}
      className="rounded-full object-cover bg-gray-50 flex-shrink-0"
    />
  );
}
