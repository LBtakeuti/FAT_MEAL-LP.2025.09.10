'use client';

import { useEffect, useRef, useState } from 'react';

const LABELS = ['カロリー', 'タンパク質', 'ボリューム', '増量適性', '続けやすさ'];
const MAX_SCORE = 5;
const NUM_AXES = 5;
const VIEW_SIZE = 320;
const CX = VIEW_SIZE / 2;
const CY = VIEW_SIZE / 2;
const MAX_R = VIEW_SIZE * 0.31;
// F65: 軸ラベルをポリゴンの外側に出すための配置半径（被り解消）
const LABEL_R = MAX_R + 30;
// F65: ラベルがはみ出ないよう viewBox に左右の余白を持たせる
const VB_PAD_X = 44;

function getAngle(i: number) {
  return (Math.PI * 2 * i) / NUM_AXES - Math.PI / 2;
}

function getPoint(i: number, r: number) {
  return {
    x: CX + r * Math.cos(getAngle(i)),
    y: CY + r * Math.sin(getAngle(i)),
  };
}

function polygonPoints(scores: number[]) {
  return scores
    .map((s, i) => {
      const r = (MAX_R / MAX_SCORE) * s;
      const p = getPoint(i, r);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

function gridPolygon(level: number) {
  const r = (MAX_R / MAX_SCORE) * level;
  return Array.from({ length: NUM_AXES }, (_, i) => {
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  }).join(' ');
}

function RadarChart({
  scores,
  color,
  isDashed,
  grown,
}: {
  scores: number[];
  color: string;
  isDashed: boolean;
  /** F61: true でポリゴンが中心から広がりきった状態。false は中心に畳まれた状態。 */
  grown: boolean;
}) {
  const rgb =
    color === '#E8593C' ? 'rgba(232,89,60,0.22)' : 'rgba(170,170,170,0.22)';

  return (
    <svg
      viewBox={`${-VB_PAD_X} 0 ${VIEW_SIZE + VB_PAD_X * 2} ${VIEW_SIZE}`}
      width="100%"
      style={{ maxWidth: 320, display: 'block' }}
    >
      {/* グリッド（5段階） */}
      {[1, 2, 3, 4, 5].map((lv) => (
        <polygon
          key={lv}
          points={gridPolygon(lv)}
          fill="none"
          stroke={lv === 5 ? '#cccccc' : '#e8e0d8'}
          strokeWidth={lv === 5 ? 1.2 : 0.8}
        />
      ))}

      {/* 軸ライン */}
      {Array.from({ length: NUM_AXES }, (_, i) => {
        const p = getPoint(i, MAX_R);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke="#e0e0e0"
            strokeWidth={0.8}
          />
        );
      })}

      {/* データエリア＋頂点ドット。
          F61: 中心(CX,CY)起点に scale 0→1 で広がる。reduced-motion 時は即 grown。 */}
      <g
        style={{
          transform: grown ? 'scale(1)' : 'scale(0)',
          transformOrigin: `${CX}px ${CY}px`,
          transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <polygon
          points={polygonPoints(scores)}
          fill={rgb}
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeDasharray={isDashed ? '6,4' : undefined}
        />
        {scores.map((s, i) => {
          const r = (MAX_R / MAX_SCORE) * s;
          const p = getPoint(i, r);
          return <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />;
        })}
      </g>

      {/* 軸ラベル。
          F65: 配置半径を広げ（LABEL_R）、軸の左右位置で textAnchor を出し分けて
          ポリゴンへの被りを解消。上下軸は中央寄せ。 */}
      {LABELS.map((label, i) => {
        const p = getPoint(i, LABEL_R);
        // x位置で左右判定（中心からの相対）。ほぼ中央(上下)は middle。
        const dx = p.x - CX;
        const anchor: 'start' | 'middle' | 'end' =
          Math.abs(dx) < 8 ? 'middle' : dx > 0 ? 'start' : 'end';
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor={anchor}
            dominantBaseline="central"
            fill="#1a1a1a"
            fontSize={14}
            fontWeight={500}
            fontFamily="'Noto Sans JP', sans-serif"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export default function ComparisonSection() {
  // F61: セクションがビューに入ったらレーダーを広げる（初回のみ）。
  // prefers-reduced-motion 有効時は即 grown（アニメなしで完成形表示）。
  const sectionRef = useRef<HTMLElement>(null);
  const [grown, setGrown] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setGrown(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setGrown(true);
          observer.disconnect(); // 初回のみ
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="comparison-section">
      <h2 className="comparison-title">ふとるめしは他と何が違うの！？</h2>
      <div className="chart-grid">
        <div className="chart-block">
          <span className="chart-label label-futoru">ふとるめし</span>
          <RadarChart scores={[5, 5, 5, 5, 4]} color="#E8593C" isDashed={false} grown={grown} />
        </div>
        <div className="chart-block">
          <span className="chart-label label-general">一般的な宅食サービス</span>
          <RadarChart scores={[2, 3, 2, 1, 4]} color="#aaaaaa" isDashed={true} grown={grown} />
        </div>
      </div>
      <div className="comparison-text-area">
        <div className="text-block">
          <span className="text-tag tag-futoru">ふとるめし</span>
          <p className="text-main">
            「<span className="text-accent">増やす</span>」ために作られている。
          </p>
          <p className="text-sub">
            増量・筋肉づくりに必要なカロリーとタンパク質を最優先に設計。太りたいアスリートのための弁当です。
          </p>
        </div>
        <div className="text-block">
          <span className="text-tag tag-general">一般的な宅食サービス</span>
          <p className="text-main">
            「減らす」ために作られている。
          </p>
          <p className="text-sub">
            多くの宅食サービスはダイエット・健康維持を目的に、カロリーや糖質を抑えることを前提に設計されています。
          </p>
        </div>
      </div>
      <p className="comparison-note">
        ※当社調べ。一般的な宅食サービスの数値は参考値です。
      </p>
    </section>
  );
}
