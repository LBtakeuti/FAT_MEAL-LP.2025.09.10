'use client';

import { useEffect, useState, useCallback } from 'react';

interface FaqItem {
  id: string;
  question: string;
  answer_title: string;
  answer_detail: string;
  sort_order: number;
}

export default function FaqSection() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/faqs');
        if (res.ok) {
          const data = (await res.json()) as FaqItem[];
          setFaqs(data);
        }
      } catch (e) {
        console.error('Failed to load faqs', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  if (loading) return null;
  if (faqs.length === 0) return null;

  return (
    <section className="bg-orange-50 py-10 sm:py-14" id="faq" aria-label="よくあるご質問">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 flex flex-col gap-5">
        {/* 見出し画像プレースホルダ（管理者が後で画像を用意して差し替える） */}
        <div className="flex justify-center">
          <span className="inline-block text-base sm:text-lg font-bold text-orange-600 tracking-wider">
            教えて！
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-lg shadow-[0_0_3px_rgba(160,192,212,0.4)] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 text-left hover:bg-orange-50/50 transition-colors"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-600 text-white font-bold text-lg leading-none flex items-center justify-center">
                    Q
                  </span>
                  <span className="flex-1 text-[15px] sm:text-base font-bold text-gray-900 tracking-wide">
                    {faq.question}
                  </span>
                  <svg
                    className={`flex-shrink-0 w-5 h-5 text-orange-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isOpen && (
                  <div className="px-3 sm:px-5 pb-4 sm:pb-5 flex flex-col gap-2">
                    <div className="h-px bg-gray-200" />
                    <div className="flex items-center gap-2 sm:gap-3 pt-1">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 text-white font-bold text-lg leading-none flex items-center justify-center">
                        A
                      </span>
                      <p className="flex-1 text-[15px] sm:text-base font-bold text-amber-600 tracking-wide">
                        {faq.answer_title}
                      </p>
                    </div>
                    {faq.answer_detail && (
                      <p className="pl-10 sm:pl-11 text-sm sm:text-[15px] text-gray-700 leading-relaxed whitespace-pre-line tracking-wide">
                        {faq.answer_detail}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
