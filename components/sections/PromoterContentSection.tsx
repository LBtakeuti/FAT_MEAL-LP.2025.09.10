import React from 'react';
import Image from 'next/image';
import type { PromoterBlock } from '@/lib/types/promoter';

interface PromoterContentSectionProps {
  blocks: PromoterBlock[];
  title?: string | null;
}

const PromoterContentSection: React.FC<PromoterContentSectionProps> = ({ blocks, title }) => {
  if (!blocks || blocks.length === 0) return null;

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
            {title}
          </h2>
        )}
        <div className="space-y-6">
          {blocks.map((block, index) => {
            if (block.type === 'image') {
              return (
                <div key={index} className="relative w-full overflow-hidden rounded-2xl">
                  <Image
                    src={block.value}
                    alt={block.alt || ''}
                    width={1200}
                    height={800}
                    className="w-full h-auto object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                  />
                </div>
              );
            }
            return (
              <p
                key={index}
                className="text-base md:text-lg text-gray-800 leading-relaxed whitespace-pre-wrap [word-break:keep-all] [overflow-wrap:normal]"
              >
                {block.value}
              </p>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PromoterContentSection;
