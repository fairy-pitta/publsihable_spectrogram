# クライアントサイドリアルタイムスペクトログラムジェネレータ

クライアントサイドのみで動作する高品質スペクトログラムジェネレータです。Rust+WASMでDSP処理を行い、TypeScript+ReactでUI・可視化・アノテーション・エクスポートを実装しています。

## 機能

- **オーディオ入力**
  - WAVファイルアップロード
  - マイク入力（リアルタイム）
  
- **STFT処理（WASM）**
  - 設定可能なパラメータ（n_fft, hop_length, window関数）
  - マグニチュード/パワースペクトラム
  - dB変換（調整可能な範囲）
  - オプション: メルスケール変換
  - スペクトラル減算ノイズ除去

- **可視化**
  - Canvas 2Dレンダリング
  - カラーマップ（viridis, magma, grayscale）
  - 明度・コントラスト・ガンマ調整
  - 軸・カラーバー表示

- **アノテーション**
  - テキストラベル
  - 矢印
  - 矩形/ハイライト
  - SVGベース（ベクター形式）

- **エクスポート**
  - SVG（スペクトログラム + アノテーション）
  - PNG（高解像度、ユーザー指定DPI）

## 技術スタック

- **フロントエンド**: TypeScript + React + Vite
- **DSP処理**: Rust + WASM (wasm-pack + wasm-bindgen)
- **テスト**: Vitest
- **アーキテクチャ**: クリーンアーキテクチャ（TDDアプローチ）

## セットアップ

### 前提条件

- Node.js 18+
- Rust (wasm-packが必要)

### インストール

```bash
# 依存関係のインストール
npm install

# WASMモジュールのビルド
npm run build:wasm
```

### 開発

```bash
# 開発サーバー起動
npm run dev

# テスト実行
npm test

# テストUI
npm run test:ui
```

### ビルド

```bash
npm run build
```

## プロジェクト構造

```
publishable_spectrogram/
├── wasm/                    # Rust WASM プロジェクト
│   ├── src/
│   │   ├── lib.rs          # WASM エントリーポイント
│   │   ├── stft.rs         # STFT実装
│   │   ├── noise_reduction.rs
│   │   └── utils.rs
│   └── Cargo.toml
├── src/
│   ├── domain/              # Domain Layer
│   ├── application/         # Application Layer
│   ├── infrastructure/      # Infrastructure Layer
│   └── presentation/        # Presentation Layer
└── tests/                   # テスト
```

## 使い方

1. WAVファイルをアップロード、またはマイク入力を開始
2. STFTパラメータを設定（必要に応じて「Recompute」をクリック）
3. 表示オプションを調整（リアルタイム更新）
4. 必要に応じてアノテーションを追加
5. 「Export」ボタンでSVG/PNGエクスポート

## ライセンス

MIT
