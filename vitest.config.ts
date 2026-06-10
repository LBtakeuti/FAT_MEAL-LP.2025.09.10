import { defineConfig } from 'vitest/config';

/**
 * F54: vitest 設定
 *
 * 目的: ユニットテストの収集対象を lib / components / src 配下の test ファイルに限定し、
 * e2e 配下の Playwright spec（test.describe 等を使用）を誤収集しないようにする。
 *
 * 背景: 設定ファイルが無く vitest のデフォルト収集に任せていたため、
 * e2e の spec ファイルが collection エラーとして表示されていた（実テスト失敗ではない）。
 *
 * 注意: 既存のユニットテスト収集対象（lib / components / src）は除外しない。
 */
export default defineConfig({
  test: {
    // ユニットテストのみを対象にする（.test.ts / .test.tsx のみ。.spec.ts は e2e 専用のため拾わない）
    include: ['{lib,components,src}/**/*.test.{ts,tsx}'],
    // 念のためデフォルト除外に e2e と node_modules / dist を明示
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
});
