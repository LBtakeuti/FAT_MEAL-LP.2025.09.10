'use client';

import React, { useEffect, useId } from 'react';

export interface SubscriptionUpsellModalProps {
  open: boolean;
  /** 「このまま進む」「✕」「背景クリック」「Escape」→ 閉じる＝お試し継続 */
  onClose: () => void;
  /** 「お得な定期を見る」→ 呼び出し側で12食定期へ切替 */
  onChoose: () => void;
}

// アクセント色はプロジェクトのブランドオレンジ（Tailwind orange-600 = #EA580C）。
// 参考HTMLの #ef8320 は使わない。
const ACCENT = '#EA580C';
const INK = '#3c3530';

// 弁当画像（任意）。ファイルが配置されたら自動で表示される。無ければ画像部は省略。
const BENTO_LEFT_SRC = '/images/upsell/bento-left.png';
const BENTO_RIGHT_SRC = '/images/upsell/bento-right.png';
// 画像を実際に配置するまでは省略する（404を避けるため明示フラグで制御）。
const SHOW_BENTO_IMAGES = false;

/**
 * ギザギザの星形シールのパスを生成する。
 * rO=外半径, rI=内半径, pts=頂点数（外側の山の数）。viewBox 100x100 中心(50,50)。
 */
function buildSealPath(rO = 50, rI = 43, pts = 16): string {
  const cx = 50;
  const cy = 50;
  const total = pts * 2;
  const step = Math.PI / pts;
  let d = '';
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? rO : rI;
    const angle = -Math.PI / 2 + i * step;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  return `${d.trim()}Z`;
}

const SEAL_PATH = buildSealPath(50, 43, 16);

const SubscriptionUpsellModal: React.FC<SubscriptionUpsellModalProps> = ({ open, onClose, onChoose }) => {
  const titleId = useId();

  // Escapeで閉じる + 背景スクロール抑止
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <style>{`
        @keyframes upsellModalPop { 0% { transform: translateY(18px) scale(.94); } 100% { transform: translateY(0) scale(1); } }
        @keyframes upsellFadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-[60] flex items-center justify-center overflow-auto p-4 sm:p-6"
        style={{ fontFamily: "'M PLUS Rounded 1c', sans-serif" }}
      >
        {/* オーバーレイ（背景クリックで閉じる＝お試し継続） */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(38,28,18,.55)', backdropFilter: 'blur(3px)', animation: 'upsellFadeIn .25s ease' }}
          onClick={onClose}
        />

        {/* モーダル本体 */}
        <div
          className="relative w-[600px] max-w-full bg-white"
          style={{
            borderRadius: 'clamp(20px, 5vw, 34px)',
            padding: 'clamp(28px, 6vw, 40px) clamp(16px, 5vw, 40px) clamp(24px, 5vw, 34px)',
            boxShadow: '0 30px 80px rgba(30,18,8,.45)',
            animation: 'upsellModalPop .38s cubic-bezier(.2,.9,.3,1.2)',
          }}
        >
          {/* 閉じる */}
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className="absolute flex items-center justify-center bg-white cursor-pointer"
            style={{
              top: 'clamp(12px, 3vw, 20px)',
              right: 'clamp(12px, 3vw, 20px)',
              width: 'clamp(38px, 9vw, 46px)',
              height: 'clamp(38px, 9vw, 46px)',
              borderRadius: '50%',
              border: `3px solid ${ACCENT}`,
              color: ACCENT,
              fontSize: 'clamp(18px, 4.5vw, 22px)',
              lineHeight: 1,
              boxShadow: 'rgba(234,88,12,.25) 0 4px 12px',
            }}
          >
            ✕
          </button>

          {/* eyebrow */}
          <div className="flex items-center justify-center" style={{ gap: 'clamp(10px, 3vw, 18px)', marginTop: 4 }}>
            <div style={{ width: 5, height: 'clamp(22px, 6vw, 30px)', background: INK, borderRadius: 3, transform: 'rotate(24deg)' }} />
            <div style={{ fontSize: 'clamp(19px, 5.2vw, 27px)', fontWeight: 800, color: INK, letterSpacing: '.04em' }}>
              ちょっと待って！！
            </div>
            <div style={{ width: 5, height: 'clamp(22px, 6vw, 30px)', background: INK, borderRadius: 3, transform: 'rotate(-24deg)' }} />
          </div>

          {/* title */}
          <div className="relative text-center" style={{ margin: '10px 0 6px' }}>
            <div id={titleId} style={{ fontSize: 'clamp(26px, 7.2vw, 40px)', fontWeight: 900, lineHeight: 1.2, letterSpacing: '.01em' }}>
              <span style={{ color: ACCENT }}>定期プラン</span>
              <span style={{ color: INK }}>の方が</span>
              <span style={{ color: ACCENT }}>お得</span>
              <span style={{ color: INK }}>かも！</span>
            </div>
            {/* 波線（装飾） */}
            <svg
              viewBox="0 0 320 14"
              preserveAspectRatio="none"
              style={{ display: 'block', width: 'min(300px, 90%)', height: 13, margin: '2px auto 0' }}
              aria-hidden="true"
            >
              <path
                d="M2 8 Q22 -2 42 8 T82 8 T122 8 T162 8 T202 8 T242 8 T282 8 T318 8"
                fill="none"
                stroke={ACCENT}
                strokeWidth={4}
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* plan cards */}
          <div
            className="relative flex items-stretch"
            style={{ gap: 'clamp(36px, 10vw, 62px)', marginTop: 18 }}
          >
            {/* LEFT: お試し */}
            <div
              className="flex flex-col overflow-hidden"
              style={{ flex: 1, borderRadius: 22, background: 'color-mix(in srgb, #EA580C 5%, #fdfaf4)' }}
            >
              <div
                className="text-center"
                style={{ padding: '15px 0 13px', background: 'linear-gradient(180deg,#fbf4e7,#f7eedd)' }}
              >
                <span style={{ fontSize: 'clamp(18px, 5vw, 27px)', fontWeight: 900, color: '#5b5147' }}>お試し6食</span>
              </div>
              <div style={{ borderTop: '3px dotted #d9cdba', margin: '0 18px' }} />
              <div className="flex flex-1 flex-col items-center" style={{ padding: '14px 10px 16px' }}>
                <div style={{ fontSize: 'clamp(14px, 3.4vw, 17px)', fontWeight: 800, color: '#5b5147' }}>1食あたり</div>
                <div style={{ fontWeight: 900, color: INK, lineHeight: 1, marginTop: 2 }}>
                  <span style={{ fontSize: 'clamp(40px, 11vw, 58px)' }}>700</span>
                  <span style={{ fontSize: 'clamp(20px, 6vw, 30px)' }}>円</span>
                </div>
                {SHOW_BENTO_IMAGES && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={BENTO_LEFT_SRC} alt="お試しのお弁当" style={{ maxWidth: '100%', marginTop: 10 }} />
                )}
              </div>
            </div>

            {/* RIGHT: 12食定期 */}
            <div
              className="flex flex-col overflow-hidden"
              style={{ flex: 1, borderRadius: 22, background: 'color-mix(in srgb, #EA580C 9%, #fff)' }}
            >
              <div className="text-center" style={{ padding: '15px 0 13px', background: ACCENT }}>
                <span style={{ fontSize: 'clamp(18px, 5vw, 27px)', fontWeight: 900, color: '#fff' }}>12食定期</span>
              </div>
              <div className="flex flex-1 flex-col items-center" style={{ padding: '14px 10px 16px' }}>
                <div style={{ fontSize: 'clamp(14px, 3.4vw, 17px)', fontWeight: 800, color: '#5b5147' }}>1食あたり</div>
                <div style={{ fontWeight: 900, color: ACCENT, lineHeight: 1, marginTop: 2 }}>
                  <span style={{ fontSize: 'clamp(40px, 11vw, 58px)' }}>550</span>
                  <span style={{ fontSize: 'clamp(20px, 6vw, 30px)' }}>円</span>
                </div>
                {SHOW_BENTO_IMAGES && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={BENTO_RIGHT_SRC} alt="12食定期のお弁当" style={{ maxWidth: '100%', marginTop: 10 }} />
                )}
              </div>
            </div>

            {/* 中央の矢印 */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: '50%',
                top: '33%',
                transform: 'translate(-50%,-50%)',
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: ACCENT,
                boxShadow: 'rgba(234,88,12,.4) 0 6px 14px',
                zIndex: 3,
              }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12h13M13 6l6 6-6 6" />
              </svg>
            </div>

            {/* 割引シール（約21%オフ） */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                left: '50%',
                top: '74%',
                transform: 'translate(-50%,-50%)',
                width: 128,
                height: 128,
                zIndex: 4,
              }}
            >
              <svg
                viewBox="0 0 100 100"
                width={128}
                height={128}
                className="absolute inset-0"
                style={{ filter: 'drop-shadow(0 6px 14px rgba(30,18,8,.25))' }}
                aria-hidden="true"
              >
                <path d={SEAL_PATH} fill="#fff" />
              </svg>
              <div className="relative text-center" style={{ lineHeight: 1, color: ACCENT }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>約</div>
                <div style={{ fontSize: 34, fontWeight: 900, margin: '-1px 0' }}>
                  21<span style={{ fontSize: 21 }}>%</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900 }}>オフ！</div>
              </div>
            </div>
          </div>

          {/* 毎月自動お届け */}
          <div className="flex items-center justify-center" style={{ gap: 16, marginTop: 26 }}>
            <div
              className="flex items-center justify-center"
              style={{ width: 64, height: 64, borderRadius: '50%', background: 'color-mix(in srgb, #EA580C 12%, #fff)', flex: 'none' }}
              aria-hidden="true"
            >
              <svg viewBox="0 0 24 24" width={34} height={34} fill="none" stroke={ACCENT} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h11v9H3z" />
                <path d="M14 9h4l3 3v3h-7z" />
                <circle cx="7" cy="17.5" r="1.8" />
                <circle cx="17.5" cy="17.5" r="1.8" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 'clamp(19px, 5.4vw, 27px)', fontWeight: 900, lineHeight: 1.15 }}>
                <span style={{ color: ACCENT }}>毎月自動</span>
                <span style={{ color: INK }}>お届け！</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#9a8f82', marginTop: 3 }}>
                解約は3ヶ月後から賜っております。
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row" style={{ gap: 16, marginTop: 22 }}>
            <button
              type="button"
              onClick={onChoose}
              className="flex flex-1 items-center justify-center cursor-pointer"
              style={{
                gap: 10,
                padding: '18px 12px',
                border: 'none',
                borderRadius: 40,
                background: ACCENT,
                color: '#fff',
                fontFamily: 'inherit',
                fontSize: 'clamp(17px, 4.6vw, 20px)',
                fontWeight: 900,
                boxShadow: 'rgba(234,88,12,.35) 0 8px 18px',
              }}
            >
              お得な定期を見る
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex flex-1 items-center justify-center bg-white cursor-pointer"
              style={{
                gap: 10,
                padding: '18px 12px',
                border: `3px solid ${ACCENT}`,
                borderRadius: 40,
                color: ACCENT,
                fontFamily: 'inherit',
                fontSize: 'clamp(17px, 4.6vw, 20px)',
                fontWeight: 900,
              }}
            >
              このまま進む
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke={ACCENT} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionUpsellModal;
