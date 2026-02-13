import type { TooltipData } from './types';

export const SNACK_BREAKDOWN: TooltipData = {
  title: '内訳の例(1日あたり)',
  items: [
    '• おにぎり(2〜3個): 200〜400円',
    '• 菓子パン(2〜3個): 450円',
    '• プロテイン(1〜2回分): 100〜200円',
    '• その他(ゼリー飲料、栄養バーなど): 200円〜300円',
  ],
  note: '1日あたり約300〜800円、月換算で9,000〜24,000円程度になります。',
};

export const FUTORUMESHI_BREAKDOWN: TooltipData = {
  title: 'ふとるめし 15,600円の内訳',
  items: [
    '• 12食プラン: 15,600円',
    '• 1食あたり: 約660円',
    '• 電子レンジ電気代: 約100円/月',
  ],
  note: '送料別です。',
};
