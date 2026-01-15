'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Footer from '@/components/Footer';

// 件名の選択肢
const SUBJECT_OPTIONS = [
  { value: '', label: '選択してください' },
  { value: 'cancellation', label: '定期便の解約について' },
  { value: 'delivery', label: '配送について' },
  { value: 'payment', label: 'お支払いについて' },
  { value: 'product', label: '商品について' },
  { value: 'account', label: '会員登録・ログインについて' },
  { value: 'other', label: 'その他' },
];

const ContactPageContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    subject: '',
    lastName: '',
    firstName: '',
    lastNameKana: '',
    firstNameKana: '',
    email: '',
    phone: '',
    message: '',
    privacyPolicy: false
  });

  // URLパラメータから件名を設定
  useEffect(() => {
    const subjectParam = searchParams.get('subject');
    if (subjectParam && SUBJECT_OPTIONS.some(opt => opt.value === subjectParam)) {
      setFormData(prev => ({ ...prev, subject: subjectParam }));
    }
  }, [searchParams]);

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.subject) newErrors.subject = '件名を選択してください';
    if (!formData.lastName) newErrors.lastName = '必須項目です';
    if (!formData.firstName) newErrors.firstName = '必須項目です';
    if (!formData.lastNameKana) newErrors.lastNameKana = '必須項目です';
    if (!formData.firstNameKana) newErrors.firstNameKana = '必須項目です';
    if (!formData.email) {
      newErrors.email = '必須項目です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }
    if (!formData.phone) newErrors.phone = '必須項目です';
    if (!formData.message) newErrors.message = '必須項目です';
    if (!formData.privacyPolicy) newErrors.privacyPolicy = 'reCAPTCHAによる保護およびプライバシーポリシーに同意してください';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // 件名のラベルを取得
    const subjectLabel = SUBJECT_OPTIONS.find(opt => opt.value === formData.subject)?.label || formData.subject;

    try {
      const res = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          title: subjectLabel, // APIには title として送信（互換性のため）
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Slack notification failed');
      }

      alert('お問い合わせを受け付けました。担当者より追ってご連絡いたします。');
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('送信に失敗しました。時間をおいて再度お試しください。');
    }
  };

  return (
    <>
      {/* Header */}
      <div className="sm:hidden">
        <MobileHeader />
      </div>
      <div className="hidden sm:block">
        <Header />
      </div>

      <main className="min-h-screen bg-gray-50 pt-20 sm:pt-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Back button */}
          <div className="pt-2 pb-2 mb-4 sm:mb-6 sm:pt-0 sm:pb-0">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center text-gray-600 hover:text-orange-600 transition-colors"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">戻る</span>
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">お問い合わせ</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 件名 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  件名 <span className="text-red-500 text-xs">必須</span>
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.subject ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {SUBJECT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
              </div>

              {/* お名前 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お名前(姓) <span className="text-red-500 text-xs">必須</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="姓"
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="名"
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div className="flex gap-4 mt-1">
                  {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName}</p>}
                  {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName}</p>}
                </div>
              </div>

              {/* お名前(カナ) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お名前(カナ) <span className="text-red-500 text-xs">必須</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="lastNameKana"
                    value={formData.lastNameKana}
                    onChange={handleInputChange}
                    placeholder="セイ"
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.lastNameKana ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <input
                    type="text"
                    name="firstNameKana"
                    value={formData.firstNameKana}
                    onChange={handleInputChange}
                    placeholder="メイ"
                    className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.firstNameKana ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div className="flex gap-4 mt-1">
                  {errors.lastNameKana && <p className="text-red-500 text-xs">{errors.lastNameKana}</p>}
                  {errors.firstNameKana && <p className="text-red-500 text-xs">{errors.firstNameKana}</p>}
                </div>
              </div>

              {/* メールアドレス */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500 text-xs">必須</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* 電話番号 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号 <span className="text-red-500 text-xs">必須</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              {/* メッセージ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ <span className="text-red-500 text-xs">必須</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={8}
                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    errors.message ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              </div>

              {/* プライバシーポリシー同意 */}
              <div className="pt-4">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="privacyPolicy"
                    checked={formData.privacyPolicy}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    このサイトはreCAPTCHAによって保護されており、Google
                    <a href="https://policies.google.com/privacy" className="text-blue-500 hover:underline mx-1" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>
                    および
                    <a href="https://policies.google.com/terms" className="text-blue-500 hover:underline mx-1" target="_blank" rel="noopener noreferrer">利用規約</a>
                    が適用されることに同意します。
                    <span className="text-red-500 ml-1">必須</span>
                  </span>
                </label>
                {errors.privacyPolicy && <p className="text-red-500 text-xs mt-1 ml-6">{errors.privacyPolicy}</p>}
              </div>

              {/* 送信ボタン */}
              <div className="text-center pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  送信
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
};

const ContactPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中...</div>}>
      <ContactPageContent />
    </Suspense>
  );
};

export default ContactPage;