'use client';

import { ReactNode } from 'react';

interface Props {
  message?: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ message = 'データがありません', description, action }: Props) {
  return (
    <div className="text-center py-10">
      <p className="text-sm font-medium text-gray-700">{message}</p>
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
