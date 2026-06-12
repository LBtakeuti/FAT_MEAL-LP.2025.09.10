'use client';

import React from 'react';
import Link from 'next/link';
import { Reveal } from '@/components/ui/Reveal';
import { CountUp } from '@/components/ui/CountUp';

interface HeroStatsSectionProps {
  hideCta?: boolean;
}

const HeroStatsSection: React.FC<HeroStatsSectionProps> = ({ hideCta = false }) => {
  return (
    <section className="hero-stats-section">
      {/* F73: 統計カードをフェードイン（PC/モバイル各ブロックを Reveal で包む） */}
      {/* PC版：3枚独立カード */}
      <Reveal className="hero-stats-pc">
        <div className="hero-stat-card">
          <p className="hsc-label">1食あたり平均カロリー</p>
          <div className="hsc-val">
            <CountUp value={520} className="hsc-num" />
            <span className="hsc-unit">kcal</span>
          </div>
          <p className="hsc-sub">増量を目指すアスリートに必要なカロリー設計</p>
        </div>

        <div className="hero-stat-card">
          <p className="hsc-label">1食あたり平均タンパク質</p>
          <div className="hsc-val">
            <CountUp value={30} className="hsc-num" />
            <span className="hsc-unit">g以上</span>
          </div>
          <p className="hsc-sub">必要な栄養を補給できる量</p>
        </div>

        <div className="hero-stat-card">
          <p className="hsc-label">調理・片付け時間</p>
          <div className="hsc-val">
            <CountUp value={0} className="hsc-num" />
            <span className="hsc-unit">分</span>
          </div>
          <p className="hsc-sub">レンチンするだけ。すぐ食べられる</p>
        </div>
      </Reveal>

      {/* モバイル版：1枠を3分割 */}
      <Reveal className="hero-stats-sp">
        <div className="hss-item">
          <p className="hss-label">平均カロリー</p>
          <div className="hss-val">
            <CountUp value={520} className="hss-num" />
            <span className="hss-unit">kcal</span>
          </div>
          <p className="hss-sub">増量に必要なカロリー</p>
        </div>

        <div className="hss-item">
          <p className="hss-label">平均タンパク質</p>
          <div className="hss-val">
            <CountUp value={30} className="hss-num" />
            <span className="hss-unit">g以上</span>
          </div>
          <p className="hss-sub">必要な栄養を補給</p>
        </div>

        <div className="hss-item">
          <p className="hss-label">調理・片付け</p>
          <div className="hss-val">
            <CountUp value={0} className="hss-num" />
            <span className="hss-unit">分</span>
          </div>
          <p className="hss-sub">レンチンするだけ</p>
        </div>
      </Reveal>

      {/* CTAボタン */}
      {!hideCta && (
        <div className="hero-stats-cta">
          <Link href="/purchase" className="hero-stats-cta-btn">
            まずは太る
          </Link>
        </div>
      )}
    </section>
  );
};

export default HeroStatsSection;
