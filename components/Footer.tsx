'use client';

import React from 'react';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white px-4 py-12 flex-1 flex flex-col justify-center">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <div className="mb-4 flex justify-center md:justify-start md:ml-12">
              <Image
                src="/footer-logo.png"
                alt="ふとるめし"
                width={200}
                height={100}
                className="h-auto w-auto max-h-20 sm:max-h-32"
              />
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">サービス</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li><a href="/menu-list" className="hover:text-white transition-colors">メニュー一覧</a></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">料金プラン</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">お問い合わせ</a></li>
              <li><a href="/news" className="hover:text-white transition-colors">お知らせ</a></li>
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