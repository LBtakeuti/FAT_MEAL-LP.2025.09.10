import React from 'react';

interface StatsTableProps {
  snackButtonRef: React.RefObject<HTMLButtonElement | null>;
  snackButtonRefDesktop: React.RefObject<HTMLButtonElement | null>;
  futorumeshiButtonRef: React.RefObject<HTMLButtonElement | null>;
  futorumeshiButtonRefDesktop: React.RefObject<HTMLButtonElement | null>;
  onSnackDetailClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onFutorumeshiDetailClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function StatsTable({
  snackButtonRef,
  snackButtonRefDesktop,
  futorumeshiButtonRef,
  futorumeshiButtonRefDesktop,
  onSnackDetailClick,
  onFutorumeshiDetailClick,
}: StatsTableProps) {
  return (
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
                <span className="text-gray-700">約9,000〜24,000円</span>
                <button
                  ref={snackButtonRef}
                  onClick={onSnackDetailClick}
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
                <span className="text-gray-900 font-bold">15,600円(12食+電気代)</span>
                <button
                  ref={futorumeshiButtonRef}
                  onClick={onFutorumeshiDetailClick}
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
                    <span>約9,000〜24,000円</span>
                    <button
                      ref={snackButtonRefDesktop}
                      onClick={onSnackDetailClick}
                      className="text-sm text-blue-600 hover:text-blue-800 underline cursor-pointer ml-2"
                    >
                      内訳を見る
                    </button>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-900 font-bold bg-orange-50">
                  <span>15,600円(12食+電気代)</span>
                  <button
                    ref={futorumeshiButtonRefDesktop}
                    onClick={onFutorumeshiDetailClick}
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
    </div>
  );
}
