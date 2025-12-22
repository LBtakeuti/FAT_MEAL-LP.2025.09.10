'use client';

import { useState, useEffect, useCallback } from 'react';
import { menuItems as staticMenuData } from '@/data/menuData';
import type { MenuItem } from '@/types';

// 静的データを初期値として変換
const initialMenuItems: MenuItem[] = staticMenuData.slice(0, 3).map((item) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: String(item.price),
  calories: String(item.calories),
  protein: String(item.protein),
  fat: String(item.fat),
  carbs: String(item.carbs),
  image: item.image,
  features: item.features,
  ingredients: item.ingredients,
  allergens: item.allergens,
}));

interface UseMenuItemsOptions {
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useMenuItems(options: UseMenuItemsOptions = {}) {
  const { limit = 3, autoRefresh = false, refreshInterval = 30000 } = options;

  const [menuItems, setMenuItems] = useState<MenuItem[]>(
    initialMenuItems.slice(0, limit)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMenuItems = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

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
          setMenuItems(data.slice(0, limit));
          setError(null);
        }
      }
    } catch {
      // エラー時は静的データを維持
    }
  }, [limit]);

  useEffect(() => {
    fetchMenuItems();

    if (autoRefresh) {
      const interval = setInterval(fetchMenuItems, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMenuItems, autoRefresh, refreshInterval]);

  return {
    menuItems,
    isLoading,
    error,
    refetch: fetchMenuItems,
  };
}
