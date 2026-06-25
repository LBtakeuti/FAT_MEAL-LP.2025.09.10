'use client';

import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe, type StripeError, type Appearance } from '@stripe/stripe-js';

// Stripeエラーコード → 日本語メッセージ変換マップ
// セキュリティルール: error.message をそのまま表示しない
const ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'カードが拒否されました。別のカードをお試しください。',
  insufficient_funds: '残高不足です。別のカードをお試しください。',
  expired_card: 'カードの有効期限が切れています。',
  incorrect_cvc: 'セキュリティコードが正しくありません。',
  incorrect_number: 'カード番号が正しくありません。',
  invalid_expiry_month: '有効期限の月が正しくありません。',
  invalid_expiry_year: '有効期限の年が正しくありません。',
  processing_error: '処理中にエラーが発生しました。しばらくしてからお試しください。',
  authentication_required: '認証が必要です。カード会社の指示に従ってください。',
  generic_decline: 'カードが拒否されました。カード会社にお問い合わせください。',
};

function getErrorMessage(error: StripeError): string {
  if (error.decline_code && ERROR_MESSAGES[error.decline_code]) {
    return ERROR_MESSAGES[error.decline_code];
  }
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  return 'お支払いに失敗しました。別のカードをお試しください。';
}

// ブランドカラーに合わせたElements appearance
const appearance: Appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#E8593C',
    colorBackground: '#ffffff',
    colorText: '#1a1a1a',
    colorDanger: '#dc2626',
    fontFamily: '"Noto Sans JP", "Helvetica Neue", Arial, sans-serif',
    borderRadius: '8px',
    spacingUnit: '4px',
  },
  rules: {
    '.Input': {
      border: '1px solid #d1d5db',
      padding: '12px',
    },
    '.Input:focus': {
      borderColor: '#E8593C',
      boxShadow: '0 0 0 2px rgba(232, 89, 60, 0.2)',
    },
    '.Label': {
      fontWeight: '500',
      fontSize: '14px',
      marginBottom: '6px',
    },
  },
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// --- 内部フォームコンポーネント ---
function PaymentForm({
  amount,
  isSetup,
  setupIntentId,
  customerId,
  onSuccess,
  onBack,
}: {
  amount: number;
  isSetup?: boolean;
  setupIntentId?: string;
  customerId?: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMessage(null);

    if (isSetup) {
      // サブスク: SetupIntent でカード登録 → Subscription開始
      const { error } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/purchase/complete`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(getErrorMessage(error));
        setProcessing(false);
        return;
      }

      // カード登録成功 → Subscriptionを開始
      try {
        const res = await fetch('/api/payment/activate-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setupIntentId, customerId }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMessage(data.error || 'サブスクリプションの開始に失敗しました');
          setProcessing(false);
          return;
        }

        // B1: 初回決済に追加認証（Link/3DS）が必要な場合はここで完了させる。
        //     無言失効を防ぐため、client_secret で handleNextAction を実行する。
        if (data.requiresAction && data.clientSecret) {
          const { error: actionError } = await stripe.handleNextAction({
            clientSecret: data.clientSecret,
          });
          if (actionError) {
            setErrorMessage(getErrorMessage(actionError));
            setProcessing(false);
            return;
          }
        }
      } catch {
        setErrorMessage('サブスクリプションの開始に失敗しました');
        setProcessing(false);
        return;
      }
    } else {
      // 買い切り: confirmPayment（3Dセキュアモーダルを自動表示）
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/purchase/complete`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setErrorMessage(getErrorMessage(error));
        setProcessing(false);
        return;
      }
    }

    // 決済成功 — Meta Pixel Purchase イベント発火
    if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
      (window as any).fbq('track', 'Purchase', {
        value: amount,
        currency: 'JPY',
      });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl p-5 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">お支払い情報</h3>
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-sm text-gray-500">お支払い金額</div>
        <div className="text-2xl font-bold text-gray-900">¥{amount.toLocaleString()}</div>
      </div>

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-[#E8593C] text-white py-3.5 rounded-full font-bold hover:bg-[#d64a2e] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {processing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            処理中...
          </span>
        ) : (
          'お支払いを確定する'
        )}
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={processing}
        className="w-full text-gray-500 text-sm hover:text-gray-700 disabled:opacity-50"
      >
        戻る
      </button>

      <p className="text-xs text-gray-400 text-center">
        お支払い情報はStripeにより安全に処理されます。カード情報は当社サーバーを経由しません。
      </p>
    </form>
  );
}

// --- エクスポートコンポーネント ---
export function StripePaymentForm({
  clientSecret,
  amount,
  isSetup,
  setupIntentId,
  customerId,
  onSuccess,
  onBack,
}: {
  clientSecret: string;
  amount: number;
  isSetup?: boolean;
  setupIntentId?: string;
  customerId?: string;
  onSuccess: () => void;
  onBack: () => void;
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
        locale: 'ja',
      }}
    >
      <PaymentForm
        amount={amount}
        isSetup={isSetup}
        setupIntentId={setupIntentId}
        customerId={customerId}
        onSuccess={onSuccess}
        onBack={onBack}
      />
    </Elements>
  );
}
