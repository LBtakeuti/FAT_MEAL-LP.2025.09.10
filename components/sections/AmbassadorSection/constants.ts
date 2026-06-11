import type { Options } from '@splidejs/splide';
import { CARD_HORIZONTAL_PADDING } from '@/lib/constants/card';

export function getCarouselOptions(count: number): Options {
  const padding = `${CARD_HORIZONTAL_PADDING}px`;

  return {
    type: count > 3 ? 'loop' : 'slide',
    perPage: 3,
    perMove: 1,
    gap: '24px',
    fixedWidth: '500px',
    padding: { left: 16, right: 16 },
    pagination: count > 3,
    arrows: count > 3,
    autoplay: count > 3,
    interval: 5000,
    pauseOnHover: true,
    speed: 500,
    drag: true,
    breakpoints: {
      1600: {
        perPage: 3,
        arrows: count > 3,
        pagination: count > 3,
        autoplay: count > 3,
      },
      1200: {
        perPage: 2,
        arrows: count > 2,
        pagination: count > 2,
        autoplay: count > 2,
      },
      768: {
        perPage: 1,
        // F66: 固定幅(327px)だと大きめスマホ(430px等)で左右に不自然な余白が出るため、
        // fixedWidth を解除して viewport 幅に追従させる（perPage:1 で流動幅）。
        // 次カードが少し覗く peek 用に左右 padding を残す。
        fixedWidth: undefined,
        gap: '16px',
        padding: { left: padding, right: padding },
        arrows: count > 1,
        pagination: count > 1,
        autoplay: count > 1,
      },
    },
  };
}
