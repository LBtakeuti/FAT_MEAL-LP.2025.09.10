import React from 'react';

const FAQSection: React.FC = () => {
  const faqs = [
    {
      question: '味は美味しいですか？',
      answer:
        'はい！ふとるめしは「ご飯が進む」ことを最優先に考え、濃いめの味付けで本格的な美味しさを追求しています。毎日食べても飽きない味わいが特徴です。',
    },
    {
      question: '賞味期限は？',
      answer:
        '冷凍保存で製造日から約6ヶ月です。解凍後は当日中にお召し上がりください。商品パッケージに記載の賞味期限をご確認ください。',
    },
    {
      question: '配送料は？',
      answer:
        '配送料は地域によって異なります。ご注文時に配送先を入力いただくと、正確な配送料が表示されます。一定金額以上のご購入で送料無料になるキャンペーンも実施中です。',
    },
    {
      question: 'アレルギー対応は？',
      answer:
        '各メニューにアレルギー情報を記載しております。商品ページで詳細をご確認いただけます。特定のアレルゲンを避けたい場合は、メニュー選択時にご注意ください。重度のアレルギーをお持ちの方は、事前にお問い合わせください。',
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-orange-50 py-12 sm:py-20">
      {/* 上部の波形 */}
      <div className="absolute top-0 left-0 w-full overflow-hidden leading-none" style={{ transform: 'translateY(-1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-white"
          ></path>
        </svg>
      </div>

      {/* 下部の波形 */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none" style={{ transform: 'translateY(1px)' }}>
        <svg
          className="relative block w-full h-16 sm:h-24"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          style={{ transform: 'scaleY(-1)' }}
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-orange-50"
          ></path>
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            よくある質問
          </h2>
          <p className="text-base sm:text-lg text-gray-600">FAQ</p>
        </div>

        {/* FAQ リスト */}
        <div className="space-y-6 sm:space-y-8">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden p-5 sm:p-6 lg:p-8"
            >
              {/* 質問 */}
              <div className="flex items-start gap-3 sm:gap-4 mb-4">
                <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                  Q
                </span>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 leading-relaxed pt-1">
                  {faq.question}
                </h3>
              </div>

              {/* 回答 */}
              <div className="flex items-start gap-3 sm:gap-4 pl-11 sm:pl-14">
                <span className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base">
                  A
                </span>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed pt-1">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* お問い合わせリンク */}
        <div className="mt-10 sm:mt-12 text-center">
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            その他のご質問はお気軽にお問い合わせください
          </p>
          <a
            href="/contact"
            className="inline-block bg-orange-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-orange-600 transition-colors shadow-lg"
          >
            お問い合わせ
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
