
# SmartBridge Translation App

Gemini AIを活用した、高度な翻訳・コミュニケーション支援ツールです。

## 公開方法

### 方法1: Vercel / Netlify (推奨: React版)
1. GitHubでリポジトリを作成し、ファイルをアップロードします。
2. ホスティングサービスにログインし、リポジトリをインポートします。
3. `Environment Variables` に `API_KEY` を設定してください。

### 方法2: Streamlit Cloud (Python版)
1. GitHubリポジトリに `streamlit_app.py` と `requirements.txt` が含まれていることを確認します。
2. [Streamlit Cloud](https://share.streamlit.io/) にアクセスし、リポジトリをデプロイします。
3. **重要**: デプロイ設定の **Advanced settings > Secrets** に以下の形式でAPIキーを入力してください。
   ```toml
   API_KEY = "あなたのGemini APIキー"
   ```

## ローカルでの実行方法 (React版)

```bash
npm install
npm run dev
```

## ローカルでの実行方法 (Streamlit版)

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```
