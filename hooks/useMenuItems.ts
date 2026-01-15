'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MenuItem } from '@/types';

interface UseMenuItemsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useMenuItems(options: UseMenuItemsOptions = {}) {
  const { limit = 20, autoRefresh = false, refreshInterval = 30000 } = options;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  const fetchMenuItems = useCallback(async (showLoading = true) => {
    try {
      // 初回読み込み時のみローディング表示
      if (showLoading) {
        setIsLoading(true);
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/menu', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const limitedData = limit > 0 ? data.slice(0, limit) : data;
          setMenuItems(limitedData);
          setError(null);
        } else {
          setMenuItems([]);
        }
      } else {
        setError('メニューの取得に失敗しました');
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('タイムアウトしました');
      } else {
        setError('メニューの取得に失敗しました');
      }
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, [limit]);

  useEffect(() => {
    // 初回読み込み
    fetchMenuItems(true);
    isInitialLoad.current = false;

    if (autoRefresh) {
      // 自動更新時はローディング表示しない
      const interval = setInterval(() => fetchMenuItems(false), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMenuItems, autoRefresh, refreshInterval]);

  return {
    menuItems,
    isLoading,
    error,
    refetch: () => fetchMenuItems(true),
  };
}
