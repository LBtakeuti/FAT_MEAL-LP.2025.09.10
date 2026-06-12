'use client';

import { useEffect, useState, useCallback } from 'react';
import { Reveal } from '@/components/ui/Reveal';

interface FaqItem {
  id: string;
  question: string;
  answer_title: string;
  answer_detail: string;
  sort_order: number;
}

interface FaqSectionProps {
  /** SEO-S1: サーバー取得済みのFAQ。あればSSRで即描画（no-JS/クローラーに本文が出る）。 */
  initialFaqs?: FaqItem[];
}

export default function FaqSection({ initialFaqs = [] }: FaqSectionProps) {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [openId, setOpenId] = useState<string | null>(null);

  // SEO-S1: 初期データが無い場合のみクライアントfetchでフォールバック取得。
  // 初期データがあればSSRの値をそのまま使う（再fetchしない＝チラつき/重複回避）。
  useEffect(() => {
    if (initialFaqs.length > 0) return;
    const load = async () => {
      try {
        const res = await fetch('/api/faqs');
        if (res.ok) {
          const data = (await res.json()) as FaqItem[];
          setFaqs(data);
        }
      } catch (e) {
        console.error('Failed to load faqs', e);
      }
    };
    load();
  }, [initialFaqs.length]);

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  }, []);

  if (faqs.length === 0) return null;

  return (
    <section className="bg-white py-12 sm:py-16" id="faq" aria-label="よくあるご質問">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-orange-500 tracking-widest font-medium text-base sm:text-lg">FAQ</p>
          <h2 className="text-orange-600 font-bold text-2xl sm:text-3xl mt-2">よくあるご質問</h2>
        </Reveal>

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
                    className={`flex-shrink-0 text-gray-400 text-2xl font-light leading-none transition-transform duration-300 ease-in-out ${
                      isOpen ? 'rotate-45' : 'rotate-0'
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                  aria-hidden={!isOpen}
                >
                  <div className="overflow-hidden">
                    <div className="pb-6">
                      <p className="text-orange-600 font-bold text-base sm:text-lg">
                        {faq.answer_title}
                      </p>
                      {faq.answer_detail && (
                        <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line mt-2">
                          {faq.answer_detail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
