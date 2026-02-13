import type { Options } from '@splidejs/splide';
import { CARD_WIDTH, CARD_HORIZONTAL_PADDING } from '@/lib/constants/card';

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
        fixedWidth: `${CARD_WIDTH}px`,
        padding: { left: padding, right: padding },
        arrows: count > 1,
        pagination: count > 1,
        autoplay: count > 1,
      },
    },
  };
}
