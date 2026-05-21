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
    <section className="bg-white py-12 sm:py-16" id="faq" aria-label="よくあるご質問">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <p className="text-gray-500 tracking-widest font-medium text-base sm:text-lg">FAQ</p>
          <h2 className="text-gray-900 font-bold text-2xl sm:text-3xl mt-2">よくあるご質問</h2>
        </div>

        <div className="mt-10 border-t border-gray-200">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div key={faq.id} className="border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => toggle(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-4 py-5 sm:py-6 text-left hover:bg-gray-50/50 transition-colors"
                >
                  <span className="flex-1 font-bold text-gray-900 text-base sm:text-lg">
                    {faq.question}
                  </span>
                  <span
                    className="flex-shrink-0 text-gray-400 text-2xl font-light leading-none"
                    aria-hidden="true"
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-6">
                    <p className="text-emerald-700 font-bold text-base sm:text-lg mt-1">
                      {faq.answer_title}
                    </p>
                    {faq.answer_detail && (
                      <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line mt-2">
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
