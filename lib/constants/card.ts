/**
 * カードコンポーネントで使用する共通定数
 */

// モバイル表示のコンテナとカードサイズ
export const MOBILE_CONTAINER_WIDTH = 375; // px
export const CARD_HORIZONTAL_PADDING = 24; // px
export const CARD_WIDTH = MOBILE_CONTAINER_WIDTH - CARD_HORIZONTAL_PADDING * 2; // 327px

// Tailwind CSS用のクラス名
export const MOBILE_CONTAINER_MAX_WIDTH = 'max-w-[375px]';
export const DESKTOP_CONTAINER_MAX_WIDTH = 'sm:max-w-7xl';

// アスペクト比
export const CARD_IMAGE_ASPECT_RATIO = 25 / 14;

// カード内の間隔
export const CARD_CONTENT_GAP = 8; // 0.5rem = 8px (gap-2)
export const CARD_SECTION_GAP = 16; // 1rem = 16px (gap-4)

// タイポグラフィ
export const CARD_TITLE_SIZE = 'text-sm'; // 14px
export const CARD_DESCRIPTION_SIZE = 'text-xs'; // 12px
export const CARD_DATE_SIZE = 'text-sm'; // 14px

// カラー
export const CARD_TEXT_COLOR = 'text-gray-700';
export const CARD_DATE_COLOR = 'text-gray-500';
