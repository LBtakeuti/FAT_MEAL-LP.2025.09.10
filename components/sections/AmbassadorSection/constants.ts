import type { Options } from '@splidejs/splide';

export const CAROUSEL_OPTIONS: Options = {
  type: 'loop',
  perPage: 3,
  perMove: 1,
  gap: '24px',
  fixedWidth: '500px',
  padding: { left: 16, right: 16 },
  pagination: true,
  arrows: true,
  autoplay: true,
  interval: 5000,
  pauseOnHover: true,
  speed: 500,
  drag: true,
  breakpoints: {
    1600: { perPage: 3 },
    1200: { perPage: 2 },
    768: { perPage: 1, fixedWidth: '300px' },
  },
};
