'use client';

import React from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-20 sm:pt-24 pb-20">
        <div className="max-w-[375px] px-4 md:max-w-[768px] md:px-6 lg:max-w-[1000px] lg:px-8 mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8">
            プライバシーポリシー
          </h1>

          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 space-y-6">
            <div className="text-gray-900 text-sm sm:text-base space-y-4">
              <p>
                LandBridge株式会社（以下「当社」）は、当社が提供するサービス（以下「本サービス」）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
              </p>
            </div>

            {/* 第1条（個人情報） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第1条（個人情報）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base">
                「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報及び容貌、指紋、声紋にかかるデータ、及び健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。
              </p>
            </div>

            {/* 第2条（個人情報の収集方法） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第2条（個人情報の収集方法）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base">
                当社は、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレス、銀行口座番号、クレジットカード番号、運転免許証番号などの個人情報をお尋ねする場合があります。また、ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を、当社の提携先（情報提供元、広告主、広告配信先などを含みます。以下「提携先」といいます）などから収集することがあります。
              </p>
            </div>

            {/* 第3条（個人情報を収集・利用する目的） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第3条（個人情報を収集・利用する目的）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base mb-2">
                当社が個人情報を収集・利用する目的は、以下のとおりです。
              </p>
              <ul className="text-gray-700 text-sm sm:text-base space-y-1 ml-4">
                <li>・当社サービスの提供・運営のため</li>
                <li>・ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                <li>・ユーザーが利用中のサービスの新機能、更新情報、キャンペーン等及び当社が提供する他のサービスの案内のメールを送付するため</li>
                <li>・メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                <li>・利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                <li>・ユーザーにご自身の登録情報の閲覧や変更、削除、ご利用状況の閲覧を行っていただくため</li>
                <li>・上記の利用目的に付随する目的</li>
              </ul>
            </div>

            {/* 第4条（利用目的の変更） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第4条（利用目的の変更）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base">
                当社は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。利用目的の変更を行った場合には、変更後の目的について、当社所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。
              </p>
            </div>

            {/* 第5条（個人情報の第三者提供） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第5条（個人情報の第三者提供）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base mb-2">
                当社は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。
              </p>
              <ul className="text-gray-700 text-sm sm:text-base space-y-1 ml-4">
                <li>・人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>・公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                <li>・国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合であって、本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき</li>
                <li>・予め次の事項を告知あるいは公表し、かつ当社が個人情報保護委員会に届出をしたとき</li>
              </ul>
            </div>

            {/* 第6条（個人情報の利用停止等） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第6条（個人情報の利用停止等）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base">
                当社は、本人から、個人情報が、利用目的の範囲を超えて取り扱われているという理由、または不正の手段により取得されたものであるという理由により、その利用の停止または消去（以下「利用停止等」といいます）を求められた場合には、遅滞なく必要な調査を行います。
              </p>
            </div>

            {/* 第7条（プライバシーポリシーの変更） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第7条（プライバシーポリシーの変更）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base">
                本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。当社が別途定める場合を除いて、変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。
              </p>
            </div>

            {/* 第8条（お問い合わせ窓口） */}
            <div className="border-t border-gray-200 pt-4">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                第8条（お問い合わせ窓口）
              </h2>
              <p className="text-gray-700 text-sm sm:text-base mb-3">
                本ポリシーに関するお問い合わせは、下記の窓口までお願いいたします。
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2">LandBridge株式会社</p>
                <p className="text-gray-700 text-sm">
                  〒343-0856 埼玉県越谷市川柳町二丁目401<br />
                  代表取締役: 三森一輝
                </p>
              </div>
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