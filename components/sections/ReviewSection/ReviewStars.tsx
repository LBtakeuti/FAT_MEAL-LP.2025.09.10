'use client';

interface Props {
  rating: number;
  size?: number;
}

export function ReviewStars({ rating, size = 14 }: Props) {
  const safe = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`星 ${safe} / 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={i < safe ? '#facc15' : '#e5e7eb'}
          aria-hidden
        >
          <polygon points="10,2 12.5,7.5 18,8 14,12 15,17.5 10,14.5 5,17.5 6,12 2,8 7.5,7.5" />
        </svg>
      ))}
    </div>
  );
}
