'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-20 sm:pt-24 pb-20">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1000px] lg:px-8 mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
            ふとるめし 利用規約
          </h1>

          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
            <div className="text-gray-900 text-sm sm:text-base">
              <p>
                本利用規約（以下「本規約」といいます）は、LandBridge株式会社（以下「当社」といいます）が提供する冷凍宅食サービス「ふとるめし」（以下「本サービス」といいます）の利用条件を定めるものです。利用者（以下「ユーザー」といいます）は、本規約に同意の上、本サービスを利用するものとします。
              </p>
            </div>

            {/* 第1条（適用） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第1条（適用）
              </h2>
              <ol className="text-gray-700 text-sm sm:text-base space-y-2 list-decimal ml-6">
                <li>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。</li>
                <li>当社は、本サービスに関し、本規約のほか、利用ガイド、注意事項等（以下「個別規定」といいます）を定めることがあり、これらは本規約の一部を構成します。</li>
              </ol>
            </div>

            {/* 第2条（利用登録） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第2条（利用登録）
              </h2>
              <ol className="text-gray-700 text-sm sm:text-base space-y-2 list-decimal ml-6">
                <li>本サービスの利用を希望する者は、本規約に同意の上、当社が定める方法により利用登録を申請し、当社が承認した時点で利用契約が成立します。</li>
                <li>当社は、以下の事由があると判断した場合、利用登録を承認しないことがあります。
                  <ul className="mt-2 space-y-1 list-disc ml-6">
                    <li>虚偽の情報を申請した場合</li>
                    <li>過去に利用規約違反等があった場合</li>
                    <li>その他、当社が不適切と判断した場合</li>
                  </ul>
                </li>
              </ol>
            </div>

            {/* 第3条（ユーザー情報の管理） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第3条（ユーザー情報の管理）
              </h2>
              <ol className="text-gray-700 text-sm sm:text-base space-y-2 list-decimal ml-6">
                <li>ユーザーは、自身の登録情報について、正確かつ最新の情報を保持するものとします。</li>
                <li>ID・パスワードの管理はユーザー自身が責任を負い、第三者の不正利用等について当社は責任を負いません。</li>
              </ol>
            </div>

            {/* 第4条（商品の注文・配送） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第4条（商品の注文・配送）
              </h2>
              <ol className="text-gray-700 text-sm sm:text-base space-y-2 list-decimal ml-6">
                <li>ユーザーは、本サービスを通じて冷凍食品を注文することができます。</li>
                <li>商品は、ユーザーが指定した住所に配送されます。配送日時は当社または配送業者の規定に従います。</li>
                <li>ユーザーの不在・受取拒否・住所不備等により商品を受け取れなかった場合、再配送費用はユーザー負担となる場合があります。</li>
              </ol>
            </div>

            {/* 第5条（商品代金・支払方法） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第5条（商品代金・支払方法）
              </h2>
              <ol className="text-gray-700 text-sm sm:text-base space-y-2 list-decimal ml-6">
                <li>商品の購入代金は、本サービス上に表示された価格とします。</li>
                <li>支払方法は、クレジットカード決済、その他当社が認める方法によります。</li>
                <li>支払いは注文確定時に成立します。</li>
              </ol>
            </div>

            {/* 第6条（返品・キャンセル） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第6条（返品・キャンセル）
              </h2>
              <ol className="text-gray-700 text-sm sm:text-base space-y-2 list-decimal ml-6">
                <li>商品到着時には、必ず内容をご確認ください。</li>
                <li>ご注文の商品と異なる場合、または破損・汚損などの不良品があった場合には、当社負担にて交換対応をいたします。</li>
                <li>上記の場合は、当社にご連絡いただいた上で、着払いにてご返送ください。</li>
                <li>食品・生鮮品という商品の性質上、上記以外の理由による返品はお受けいたしかねます。</li>
                <li>ご注文確定後のキャンセルはお受けいたしかねますので、あらかじめご了承ください。</li>
              </ol>
            </div>

            {/* 第7条（禁止事項） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第7条（禁止事項）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base mb-2">
                ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="text-gray-700 text-sm sm:text-base space-y-1 list-disc ml-6">
                <li>法令または公序良俗に違反する行為</li>
                <li>他のユーザーまたは第三者の権利を侵害する行為</li>
                <li>本サービスの運営を妨害する行為</li>
                <li>虚偽の情報を登録する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </div>

            {/* 第8条（サービス提供の停止・終了） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第8条（サービス提供の停止・終了）
              </h2>
              <ol className="text-gray-700 text-sm sm:text-base space-y-2 list-decimal ml-6">
                <li>当社は、以下の場合にユーザーに事前通知することなく本サービスの提供を停止・終了することができます。
                  <ul className="mt-2 space-y-1 list-disc ml-6">
                    <li>システム保守や障害発生時</li>
                    <li>天災地変、配送業者のトラブル等によりサービス継続が困難となった場合</li>
                    <li>その他、当社が必要と判断した場合</li>
                  </ul>
                </li>
                <li>これによりユーザーに損害が生じても、当社は一切責任を負いません。</li>
              </ol>
            </div>

            {/* 第9条（免責事項） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第9条（免責事項）
              </h2>
              <ol className="text-gray-700 text-sm sm:text-base space-y-2 list-decimal ml-6">
                <li>商品の味覚や好みに関する不一致について、当社は責任を負いません。</li>
                <li>ユーザーの過失により商品が劣化した場合、当社は責任を負いません。</li>
                <li>本サービスの利用により生じたいかなる損害についても、当社の故意または重過失による場合を除き、責任を負いません。</li>
              </ol>
            </div>

            {/* 第10条（個人情報の取扱い） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第10条（個人情報の取扱い）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base">
                当社は、ユーザーの個人情報をプライバシーポリシーに従って適切に取り扱います。
              </p>
            </div>

            {/* 第11条（規約の変更） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第11条（規約の変更）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base">
                当社は、必要に応じて本規約を変更することができ、変更後の規約は本サービスに掲示した時点から効力を生じるものとします。
              </p>
            </div>

            {/* 第12条（準拠法・管轄裁判所） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第12条（準拠法・管轄裁判所）
              </h2>
              <ol className="text-gray-700 text-sm sm:text-base space-y-2 list-decimal ml-6">
                <li>本規約の解釈および適用は、日本法に準拠します。</li>
                <li>本サービスに関して紛争が生じた場合、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
              </ol>
            </div>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-white border-2 border-orange-600 text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-orange-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>ホームに戻る</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}