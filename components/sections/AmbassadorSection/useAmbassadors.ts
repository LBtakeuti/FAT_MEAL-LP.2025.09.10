import { useState, useEffect } from 'react';
import type { AmbassadorItem } from '@/types/ambassador';

export function useAmbassadors() {
  const [ambassadors, setAmbassadors] = useState<AmbassadorItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAmbassadors = async () => {
      try {
        const response = await fetch('/api/ambassadors');
        if (response.ok) {
          const data = await response.json();
          setAmbassadors(data);
        }
      } catch (error) {
        console.error('Failed to fetch ambassadors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAmbassadors();
  }, []);

  return { ambassadors, loading };
}
