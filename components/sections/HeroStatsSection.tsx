'use client';

import React from 'react';
import Link from 'next/link';

interface HeroStatsSectionProps {
  hideCta?: boolean;
}

const HeroStatsSection: React.FC<HeroStatsSectionProps> = ({ hideCta = false }) => {
  return (
    <section className="hero-stats-section">
      {/* PC版：3枚独立カード */}
      <div className="hero-stats-pc">
        <div className="hero-stat-card">
          <p className="hsc-label">1食あたり平均カロリー</p>
          <div className="hsc-val">
            <span className="hsc-num">520</span>
            <span className="hsc-unit">kcal</span>
          </div>
          <p className="hsc-sub">増量を目指すアスリートに必要なカロリー設計</p>
        </div>

        <div className="hero-stat-card">
          <p className="hsc-label">1食あたり平均タンパク質</p>
          <div className="hsc-val">
            <span className="hsc-num">30</span>
            <span className="hsc-unit">g以上</span>
          </div>
          <p className="hsc-sub">必要な栄養を補給できる量</p>
        </div>

        <div className="hero-stat-card">
          <p className="hsc-label">調理・片付け時間</p>
          <div className="hsc-val">
            <span className="hsc-num">0</span>
            <span className="hsc-unit">分</span>
          </div>
          <p className="hsc-sub">レンチンするだけ。すぐ食べられる</p>
        </div>
      </div>

      {/* モバイル版：1枠を3分割 */}
      <div className="hero-stats-sp">
        <div className="hss-item">
          <p className="hss-label">平均カロリー</p>
          <div className="hss-val">
            <span className="hss-num">520</span>
            <span className="hss-unit">kcal</span>
          </div>
          <p className="hss-sub">増量に必要なカロリー</p>
        </div>

        <div className="hss-item">
          <p className="hss-label">平均タンパク質</p>
          <div className="hss-val">
            <span className="hss-num">30</span>
            <span className="hss-unit">g以上</span>
          </div>
          <p className="hss-sub">必要な栄養を補給</p>
        </div>

        <div className="hss-item">
          <p className="hss-label">調理・片付け</p>
          <div className="hss-val">
            <span className="hss-num">0</span>
            <span className="hss-unit">分</span>
          </div>
          <p className="hss-sub">レンチンするだけ</p>
        </div>
      </div>

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
