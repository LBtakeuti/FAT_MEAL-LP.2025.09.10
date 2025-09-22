'use client';

import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white px-4 py-12 flex-1 flex flex-col justify-center">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold text-orange-600 mb-4">ふとるめし</h3>
            <p className="text-gray-400 text-sm">
              高カロリー・高栄養の冷凍宅食サービス
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">サービス</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">メニュー一覧</a></li>
              <li><a href="#" className="hover:text-white transition-colors">料金プラン</a></li>
              <li><a href="#" className="hover:text-white transition-colors">配送について</a></li>
              <li><a href="#" className="hover:text-white transition-colors">よくある質問</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <p>© 2024 ふとるめし. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="/terms" className="hover:text-white transition-colors">利用規約</a>
              <a href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</a>
              <a href="/legal" className="hover:text-white transition-colors">特定商取引法</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;