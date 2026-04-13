'use client';

const LABELS = ['カロリー', 'タンパク質', 'ボリューム', '増量適性', '続けやすさ'];
const MAX_SCORE = 5;
const NUM_AXES = 5;
const VIEW_SIZE = 320;
const CX = VIEW_SIZE / 2;
const CY = VIEW_SIZE / 2;
const MAX_R = VIEW_SIZE * 0.31;

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
}: {
  scores: number[];
  color: string;
  isDashed: boolean;
}) {
  const rgb =
    color === '#E8593C' ? 'rgba(232,89,60,0.22)' : 'rgba(170,170,170,0.22)';

  return (
    <svg
      viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
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

      {/* データエリア */}
      <polygon
        points={polygonPoints(scores)}
        fill={rgb}
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeDasharray={isDashed ? '6,4' : undefined}
      />

      {/* 頂点ドット */}
      {scores.map((s, i) => {
        const r = (MAX_R / MAX_SCORE) * s;
        const p = getPoint(i, r);
        return <circle key={i} cx={p.x} cy={p.y} r={4} fill={color} />;
      })}

      {/* 軸ラベル */}
      {LABELS.map((label, i) => {
        const p = getPoint(i, MAX_R + 24);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
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
  return (
    <section className="comparison-section">
      <h2 className="comparison-title">ふとるめしは他と何が違うの！？</h2>
      <div className="chart-grid">
        <div className="chart-block">
          <span className="chart-label label-futoru">ふとるめし</span>
          <RadarChart scores={[5, 5, 5, 5, 4]} color="#E8593C" isDashed={false} />
        </div>
        <div className="chart-block">
          <span className="chart-label label-general">一般的な宅食サービス</span>
          <RadarChart scores={[2, 3, 2, 1, 4]} color="#aaaaaa" isDashed={true} />
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
