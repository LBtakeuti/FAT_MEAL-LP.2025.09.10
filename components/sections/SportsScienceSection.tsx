'use client';

import React, { useState } from 'react';
import Link from 'next/link';

type SportTab = 'baseball' | 'soccer' | 'football';

interface StatColumn {
  sportLabel: string;
  benefit: string;
  source: string;
}

interface TabData {
  id: SportTab;
  label: string;
  columns: StatColumn[];
}

const TABS: TabData[] = [
  {
    id: 'baseball',
    label: '野球',
    columns: [
      {
        sportLabel: '野球 ／ 打者',
        benefit: '体重が増えると、スイングスピードが上がる',
        source: '出典：国際武道大学 笠原政志教授 高校野球選手体組成調査（2020〜2021年）',
      },
      {
        sportLabel: '野球 ／ 投手',
        benefit: '体幹が大きくなると、球が速くなる',
        source: '出典：国際武道大学 TORCH 体組成調査',
      },
      {
        sportLabel: '野球 ／ 体重維持',
        benefit: '食事が落ちると、冬に積み上げた筋肉が衰える',
        source: '出典：国際武道大学 笠原政志教授',
      },
    ],
  },
  {
    id: 'soccer',
    label: 'サッカー',
    columns: [
      {
        sportLabel: 'サッカー ／ コンタクト',
        benefit: '筋肉量が増えると、当たり負けしなくなる',
        source: '出典：明治安田生命 Jリーグ選手体組成分析',
      },
      {
        sportLabel: 'サッカー ／ スプリント',
        benefit: '体格があると、後半でも走り続けられる',
        source: '出典：Jリーグ 2022年 試合データ',
      },
      {
        sportLabel: 'サッカー ／ 体格',
        benefit: 'プロになるほど、体が大きい',
        source: '出典：J1リーグ登録選手データ（2024年）',
      },
    ],
  },
  {
    id: 'football',
    label: 'アメフト',
    columns: [
      {
        sportLabel: 'アメフト ／ 筋力',
        benefit: '1年間食べ続けると、筋力が3割上がる',
        source: '出典：Yamashita D. et al. 縦断研究（2023）',
      },
      {
        sportLabel: 'アメフト ／ コンタクト',
        benefit: '重くなると、ラインで押し勝てる',
        source: '出典：NSCA アメフト筋力・パワー研究',
      },
      {
        sportLabel: 'アメフト ／ 増量',
        benefit: '筋肉で太れば、スピードは落ちない',
        source: '出典：エムズ整骨院 アスリート増量研究',
      },
    ],
  },
];

const SportsScienceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SportTab>('baseball');
  const activePanel = TABS.find((t) => t.id === activeTab)!;

  return (
    <section className="sports-science-section">
      <div className="inner">
        {/* 小ラベル */}
        <p className="small-label">Sports Science</p>

        {/* メインタイトル */}
        <h2 className="main-title">
          太れば、<span className="accent">変わる。</span>
        </h2>

        {/* タイトル下の水平線 */}
        <div className="title-rule" />

        {/* タブボタン */}
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* タブパネル */}
        <div className="sport-panel">
          <div className="grid">
            {activePanel.columns.map((col, i) => (
              <div key={i} className="col">
                <p className="sport-label">{col.sportLabel}</p>
                <p className="benefit">{col.benefit}</p>
                <div className="divline" />
                <p className="source">{col.source}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTAエリア */}
        <div className="cta-area">
          <p className="cta-lead">
            <span style={{ color: '#1a1a1a' }}>あとは、食べるだけ。</span>
            <br />
            <span style={{ color: '#888888' }}>
              まずは6個のお試しセットから始めてみませんか。
            </span>
          </p>
          <div className="cta-btn-wrap">
            <Link href="/purchase?type=trial" className="cta-primary">
              お試し6個セットを注文する
            </Link>
            <Link href="/purchase?type=subscription" className="cta-secondary">
              定期コースを見る
            </Link>
          </div>
          <p className="cta-note">
            送料無料 ・ いつでも解約可能 ・ 管理栄養士監修
          </p>
        </div>
      </div>
    </section>
  );
};

export default SportsScienceSection;
