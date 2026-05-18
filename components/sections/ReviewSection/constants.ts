import type { Options } from '@splidejs/splide';

/**
 * モバイル: 1カラム(スナップ) / タブレット: 2 / PC: 3〜4
 */
export function getReviewCarouselOptions(count: number): Options {
  return {
    type: count > 4 ? 'loop' : 'slide',
    perPage: 4,
    perMove: 1,
    gap: '1.5rem',
    padding: { left: '2.5rem', right: '2.5rem' },
    pagination: count > 4,
    arrows: count > 4,
    autoplay: count > 4,
    interval: 4500,
    pauseOnHover: true,
    breakpoints: {
      1280: {
        perPage: 3,
        arrows: count > 3,
        pagination: count > 3,
        autoplay: count > 3,
      },
      1024: {
        perPage: 3,
        arrows: count > 3,
        pagination: count > 3,
        autoplay: count > 3,
      },
      768: {
        perPage: 2,
        arrows: count > 2,
        pagination: count > 2,
        autoplay: count > 2,
      },
      640: {
        perPage: 1,
        gap: '0.75rem',
        // 次カードがちらっと見えるよう左右に余白を残してスナップさせる
        padding: { left: '1.5rem', right: '1.5rem' },
        arrows: false,
        pagination: count > 1,
        autoplay: count > 1,
      },
    },
  };
}
