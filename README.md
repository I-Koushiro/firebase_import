# Firestore Import Project — 初期設定手順

このプロジェクトは Firestore に JSON 形式のデータをインポートするためのツールです。  
以下の手順に従って初期設定を行ってください。  

## インストール

1. リポジトリをクローン（またはプロジェクトディレクトリに移動）

```bash
git clone https://<Your_GitHub_Username>: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@github.com/I-Koushiro/firebase_import.git
cd firebase_import
```

2. 依存パッケージをインストール
```bash
npm install
```

3. Firebase 管理者認証の設定

Firestore へアクセスするために、サービスアカウントキーの設定を行います。  
```bash
①Firebase コンソール → プロジェクト設定 を開く
②サービスアカウント タブへ移動
③新しい秘密鍵の生成 をクリックして JSON をダウンロード
④ダウンロードしたファイルを次の場所に保存
　[ProjectDirectory]/secret/secret-key.json
※ 秘密鍵のファイル名を、「secret-key.json」に変更してください。
※ このファイルは絶対に公開しないでください
```

4. JSON データの配置

インポートしたい JSON ファイルをプロジェクト直下の data/ ディレクトリに置きます。  

5. インポートの実行

以下のコマンドを実行します。
```bash
npm run import
```