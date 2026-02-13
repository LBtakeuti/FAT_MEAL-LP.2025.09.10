declare module '@splidejs/react-splide' {
  import { ComponentType, ReactNode } from 'react';

  interface SplideProps {
    options?: Record<string, unknown>;
    'aria-label'?: string;
    className?: string;
    children?: ReactNode;
  }

  interface SplideSlideProps {
    children?: ReactNode;
    className?: string;
  }

  export const Splide: ComponentType<SplideProps>;
  export const SplideSlide: ComponentType<SplideSlideProps>;
}

declare module '@splidejs/react-splide/css' {}
