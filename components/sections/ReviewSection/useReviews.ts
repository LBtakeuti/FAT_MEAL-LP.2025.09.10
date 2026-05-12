import { useEffect, useState } from 'react';
import type { ReviewItem } from '@/types/review';

export function useReviews() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/reviews')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setReviews(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error('Failed to fetch reviews:', err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { reviews, loading };
}
