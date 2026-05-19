'use client';

interface Props {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-b-2',
};

export function LoadingSpinner({ label = '読み込み中...', size = 'lg' }: Props) {
  return (
    <div className="text-center py-8">
      <div className={`animate-spin rounded-full border-orange-600 mx-auto ${SIZE[size]}`} />
      {label && <p className="mt-3 text-sm text-gray-500">{label}</p>}
    </div>
  );
}
