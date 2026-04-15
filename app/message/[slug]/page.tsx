import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase';
import { MessageImageCarousel } from '@/components/message/MessageImageCarousel';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = 'force-dynamic';

export default async function IndividualMessagePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createServerClient() as any;

  const { data: message } = await supabase
    .from('individual_messages')
    .select('title, body_html, images, is_active')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (!message) notFound();

  const m = message as {
    title: string;
    body_html: string;
    images: string[] | null;
  };
  const images = Array.isArray(m.images) ? m.images.filter((u) => typeof u === 'string') : [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 sm:pt-12 pb-12">
      {/* 画像エリア */}
      {images.length === 1 && (
        <div className="w-full bg-gray-50 flex items-center justify-center overflow-hidden rounded-lg mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt={m.title}
            className="w-full h-auto object-contain"
          />
        </div>
      )}
      {images.length > 1 && (
        <div className="mb-12">
          <MessageImageCarousel images={images} alt={m.title} />
        </div>
      )}

      {/* 見出し */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 break-keep">
        {m.title}
      </h1>

      {/* 本文 */}
      <article
        className="message-body"
        dangerouslySetInnerHTML={{ __html: m.body_html || '' }}
      />
    </div>
  );
}
