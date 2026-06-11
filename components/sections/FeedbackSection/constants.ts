import type { Options } from '@splidejs/splide';

export function getCarouselOptions(count: number): Options {
  return {
    type: count > 4 ? 'loop' : 'slide',
    perPage: 4,
    gap: '1.5rem',
    padding: { left: '2.5rem', right: '2.5rem' },
    pagination: count > 4,
    arrows: count > 4,
    autoplay: count > 4,
    interval: 4000,
    pauseOnHover: true,
    breakpoints: {
      1280: {
        perPage: 3,
        arrows: count > 3,
        pagination: count > 3,
        autoplay: count > 3,
      },
      1024: {
        perPage: 2,
        arrows: count > 2,
        pagination: count > 2,
        autoplay: count > 2,
      },
      640: {
        perPage: 1,
        // F68: 次カードのpeekが右に離れすぎていたため gap/padding を詰める。
        // gap を 1rem→0.5rem、右paddingを抑えて次カードが自然な近さで覗くように。
        gap: '0.5rem',
        padding: { left: '16px', right: '28px' },
        arrows: count > 1,
        pagination: count > 1,
        autoplay: count > 1,
      },
    },
  };
}
