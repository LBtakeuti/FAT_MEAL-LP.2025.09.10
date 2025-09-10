'use client';

import React from 'react';

interface NewsItem {
  date: string;
  category: string;
  title: string;
}

const NewsSection: React.FC = () => {
  const newsItems: NewsItem[] = [
    {
      date: '2024.01.15',
      category: '新商品',
      title: '新メニュー「クリームシチュー」が登場しました'
    },
    {
      date: '2024.01.10',
      category: 'お知らせ',
      title: '送料無料キャンペーン実施中（1月末まで）'
    },
    {
      date: '2024.01.05',
      category: 'メディア',
      title: 'テレビ番組「健康ライフ」で紹介されました'
    },
    {
      date: '2023.12.28',
      category: 'お知らせ',
      title: '年末年始の配送スケジュールについて'
    },
    {
      date: '2023.12.20',
      category: '新商品',
      title: '冬季限定メニュー3品を追加しました'
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '新商品':
        return 'bg-green-100 text-green-700';
      case 'お知らせ':
        return 'bg-blue-100 text-blue-700';
      case 'メディア':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <section id="news" className="min-h-screen flex items-center bg-white py-20">
      <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1200px] lg:px-8 mx-auto w-full">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            お<span className="text-orange-600">知らせ</span>
          </h2>
          <p className="text-lg text-gray-600">
            最新情報をお届けします
          </p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8">
          <div className="space-y-4">
            {newsItems.map((item, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg p-6 hover-card cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <span className="text-gray-500 text-sm font-medium">
                    {item.date}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item.category)} w-fit`}>
                    {item.category}
                  </span>
                  <h3 className="text-gray-900 font-medium flex-1">
                    {item.title}
                  </h3>
                  <span className="text-orange-600 hover:text-orange-700">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <button className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">
              すべてのお知らせを見る →
            </button>
          </div>
        </div>

        <div className="mt-12 bg-orange-50 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            メールマガジン登録
          </h3>
          <p className="text-gray-700 mb-6">
            新商品やキャンペーン情報をいち早くお届けします
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="メールアドレスを入力"
              className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-orange-600 focus:outline-none"
            />
            <button className="bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors">
              登録する
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;