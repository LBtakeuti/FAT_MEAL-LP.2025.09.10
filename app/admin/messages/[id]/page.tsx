'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { IndividualMessageForm, type MessageFormData } from '@/components/admin/IndividualMessageForm';

export default function EditMessagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [initial, setInitial] = useState<MessageFormData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/admin/messages/${id}`);
      if (!res.ok) {
        alert('メッセージの取得に失敗しました');
        router.push('/admin/messages');
        return;
      }
      const data = await res.json();
      if (cancelled) return;
      setInitial({
        slug: data.slug || '',
        title: data.title || '',
        body_html: data.body_html || '',
        images: Array.isArray(data.images) ? data.images : [],
        is_active: data.is_active ?? true,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (!initial) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600" />
      </div>
    );
  }

  return <IndividualMessageForm mode="edit" id={id} initial={initial} />;
}
