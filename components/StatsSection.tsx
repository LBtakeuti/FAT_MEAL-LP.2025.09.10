'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

const StatsSection: React.FC = () => {
  // 補食側のツールチップ
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const buttonRefDesktop = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  // ふとるめし側のツールチップ
  const [isFutorumeshiDetailOpen, setIsFutorumeshiDetailOpen] = useState(false);
  const futorumeshiButtonRef = useRef<HTMLButtonElement>(null);
  const futorumeshiButtonRefDesktop = useRef<HTMLButtonElement>(null);
  const futorumeshiTooltipRef = useRef<HTMLDivElement>(null);
  const [futorumeshiTooltipPosition, setFutorumeshiTooltipPosition] = useState({ top: 0, left: 0 });

  // 補食側のツールチップ位置を計算
  const calculateTooltipPosition = (btn: HTMLButtonElement) => {
    const buttonRect = btn.getBoundingClientRect();
    const container = btn.closest('.table-container') as HTMLElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setTooltipPosition({
        top: buttonRect.bottom - containerRect.top + 8,
        left: buttonRect.left - containerRect.left,
      });
    }
  };

  // ふとるめし側のツールチップ位置を計算
  const calculateFutorumeshiTooltipPosition = (btn: HTMLButtonElement) => {
    const buttonRect = btn.getBoundingClientRect();
    const container = btn.closest('.table-container') as HTMLElement;
    if (container) {
      const containerRect = container.getBoundingClientRect();
      setFutorumeshiTooltipPosition({
        top: buttonRect.bottom - containerRect.top + 8,
        left: buttonRect.left - containerRect.left,
      });
    }
  };

  // 補食側ボタンのクリックハンドラー
  const handleDetailClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    if (!isDetailOpen) {
      calculateTooltipPosition(btn);
    }
    setIsDetailOpen(!isDetailOpen);
    setIsFutorumeshiDetailOpen(false);
  };

  // ふとるめし側ボタンのクリックハンドラー
  const handleFutorumeshiDetailClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    if (!isFutorumeshiDetailOpen) {
      calculateFutorumeshiTooltipPosition(btn);
    }
    setIsFutorumeshiDetailOpen(!isFutorumeshiDetailOpen);
    setIsDetailOpen(false);
  };

  // リサイズ時に位置を更新
  useEffect(() => {
    if (isDetailOpen) {
      const updatePosition = () => {
        const btn = buttonRef.current || buttonRefDesktop.current;
        if (btn) {
          calculateTooltipPosition(btn);
        }
      };
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isDetailOpen]);

  // ふとるめし側のリサイズ時に位置を更新
  useEffect(() => {
    if (isFutorumeshiDetailOpen) {
      const updatePosition = () => {
        const btn = futorumeshiButtonRef.current || futorumeshiButtonRefDesktop.current;
        if (btn) {
          calculateFutorumeshiTooltipPosition(btn);
        }
      };
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isFutorumeshiDetailOpen]);

  // 外部クリックで閉じる
  useEffect(() => {
    if (isDetailOpen || isFutorumeshiDetailOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        // 補食側
        if (isDetailOpen) {
          const isInsideTooltip = tooltipRef.current?.contains(target);
          const isInsideButton = buttonRef.current?.contains(target) || buttonRefDesktop.current?.contains(target);
          if (!isInsideTooltip && !isInsideButton) {
            setIsDetailOpen(false);
          }
        }
        // ふとるめし側
        if (isFutorumeshiDetailOpen) {
          const isInsideTooltip = futorumeshiTooltipRef.current?.contains(target);
          const isInsideButton = futorumeshiButtonRef.current?.contains(target) || futorumeshiButtonRefDesktop.current?.contains(target);
          if (!isInsideTooltip && !isInsideButton) {
            setIsFutorumeshiDetailOpen(false);
          }
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDetailOpen, isFutorumeshiDetailOpen]);
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-white py-12 sm:py-20">
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
            className="fill-orange-50"
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
            className="fill-white"
          ></path>
        </svg>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* セクションタイトル */}
        <div className="text-center mb-10 sm:mb-16 relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 relative z-10">
            データで見る<br className="sm:hidden" />「ふとるめし」
          </h2>
          <div className="flex justify-center -mt-6 sm:-mt-8 relative z-0">
            <Image
              src="/b_simple_111_0M 2.png"
              alt=""
              width={3923}
              height={465}
              className="w-full max-w-3xl h-auto"
            />
          </div>
        </div>

        {/* 比較表 */}
        <div className="mb-16 sm:mb-20 relative table-container">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 font-antique">
            部活を本気で頑張る子の補食代とふとるめしの比較
          </h3>

          {/* モバイル用縦型レイアウト */}
          <div className="md:hidden space-y-4">
            {/* 補食・間食費 */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gray-100 py-3 px-4">
                <h4 className="font-bold text-gray-900 font-antique">補食・間食費</h4>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="flex justify-between items-start py-3 px-4">
                  <span className="font-bold text-gray-900 font-antique text-sm">1ヶ月の費用</span>
                  <div className="text-right">
                    <span className="text-gray-700">約25,000〜30,000円</span>
                    <button
                      ref={buttonRef}
                      onClick={handleDetailClick}
                      className="block text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer mt-1"
                    >
                      内訳を見る
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="font-bold text-gray-900 font-antique text-sm">栄養バランス</span>
                  <span className="text-gray-700">△ 偏りがち</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="font-bold text-gray-900 font-antique text-sm">準備の手間</span>
                  <span className="text-gray-700">毎日買いに行く</span>
                </div>
              </div>
            </div>

            {/* ふとるめし */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 py-3 px-4">
                <h4 className="font-bold text-white font-antique">ふとるめし</h4>
              </div>
              <div className="divide-y divide-gray-100 bg-orange-50">
                <div className="flex justify-between items-start py-3 px-4">
                  <span className="font-bold text-gray-900 font-antique text-sm">1ヶ月の費用</span>
                  <div className="text-right">
                    <span className="text-gray-900 font-bold">28,900円（24食+電気代）</span>
                    <button
                      ref={futorumeshiButtonRef}
                      onClick={handleFutorumeshiDetailClick}
                      className="block text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer mt-1"
                    >
                      内訳を見る
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="font-bold text-gray-900 font-antique text-sm">栄養バランス</span>
                  <span className="text-gray-900 font-bold">◎ 管理栄養士監修</span>
                </div>
                <div className="flex justify-between items-center py-3 px-4">
                  <span className="font-bold text-gray-900 font-antique text-sm">準備の手間</span>
                  <span className="text-gray-900 font-bold">レンジで5分</span>
                </div>
              </div>
            </div>
          </div>

          {/* デスクトップ用横型テーブル */}
          <div className="hidden md:block bg-white rounded-2xl shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-4 px-6 text-left font-bold text-gray-900"></th>
                    <th className="py-4 px-6 text-left font-bold text-gray-900 font-antique bg-gray-100">
                      補食・間食費
                    </th>
                    <th className="py-4 px-6 text-left font-bold text-white font-antique bg-gradient-to-r from-orange-500 to-red-500">
                      ふとるめし
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 font-bold text-gray-900 font-antique bg-gray-50">1ヶ月の費用</td>
                    <td className="py-4 px-6 text-gray-700 bg-gray-50 relative">
                      <div className="relative inline-block">
                        <span>約25,000〜30,000円</span>
                        <button
                          ref={buttonRefDesktop}
                          onClick={handleDetailClick}
                          className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer ml-2"
                        >
                          内訳を見る
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-900 font-bold bg-orange-50">
                      <span>28,900円（24食+電気代）</span>
                      <button
                        ref={futorumeshiButtonRefDesktop}
                        onClick={handleFutorumeshiDetailClick}
                        className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer ml-2"
                      >
                        内訳を見る
                      </button>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 font-bold text-gray-900 font-antique bg-gray-50">栄養バランス</td>
                    <td className="py-4 px-6 text-gray-700 bg-gray-50">△ 偏りがち</td>
                    <td className="py-4 px-6 text-gray-900 font-bold bg-orange-50">◎ 管理栄養士監修</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-bold text-gray-900 font-antique bg-gray-50">準備の手間</td>
                    <td className="py-4 px-6 text-gray-700 bg-gray-50">毎日買いに行く</td>
                    <td className="py-4 px-6 text-gray-900 font-bold bg-orange-50">レンジで5分</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          {/* ツールチップ - 補食側 */}
          {isDetailOpen && (
            <div
              ref={tooltipRef}
              className="absolute w-[calc(100%-2rem)] sm:w-96 p-4 bg-gray-900 text-white rounded-lg z-[100] left-4 sm:left-auto"
              style={{
                top: tooltipPosition.top > 0 ? `${tooltipPosition.top}px` : '100px',
                ...(tooltipPosition.left > 0 ? { left: `${tooltipPosition.left}px` } : {}),
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
              <p className="font-bold mb-3 text-white">内訳の例（1日あたり）</p>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>• おにぎり（2〜3個）: 200〜400円</li>
                <li>• 菓子パン（2〜3個）: 450円</li>
                <li>• プロテイン（1〜2回分）: 100〜200円</li>
                <li>• その他（ゼリー飲料、栄養バーなど）: 200円〜300円</li>
              </ul>
              <p className="mt-3 text-sm text-gray-300">
                1日あたり約300〜800円、月換算で9,000〜24,000円程度になります。
              </p>
            </div>
          )}

          {/* ツールチップ - ふとるめし側 */}
          {isFutorumeshiDetailOpen && (
            <div
              ref={futorumeshiTooltipRef}
              className="absolute w-auto max-w-[calc(100%-2rem)] sm:max-w-md p-4 bg-gray-900 text-white rounded-lg z-[100] left-4 sm:left-auto"
              style={{
                top: futorumeshiTooltipPosition.top > 0 ? `${futorumeshiTooltipPosition.top}px` : '100px',
                ...(futorumeshiTooltipPosition.left > 0 ? { left: `${futorumeshiTooltipPosition.left}px` } : {}),
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
              }}
            >
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
              <p className="font-bold mb-3 text-white">ふとるめし 28,900円の内訳</p>
              <ul className="space-y-2 text-sm text-gray-200">
                <li>• 24食セット: 28,800円</li>
                <li>• 1食あたり: 約1,200円</li>
                <li>• 電子レンジ電気代: 約100円/月</li>
              </ul>
              <p className="mt-3 text-sm text-gray-300">
                送料別です。
              </p>
            </div>
          )}
        </div>


      </div>
    </section>
  );
};

export default StatsSection;
