
import streamlit as st
import google.generativeai as genai
import json
import os

# ページ設定
st.set_page_config(page_title="SmartBridge - AI翻訳添削", layout="wide")

# スタイル調整
st.markdown("""
    <style>
    .main { background-color: #f8fafc; }
    .stTextArea textarea { font-size: 1rem; }
    .critique-box { padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1.5rem; }
    .suggestion-card { background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    </style>
""", unsafe_allow_html=True)

# APIキーの設定 (Streamlit Secrets または 環境変数から取得)
api_key = st.secrets.get("API_KEY") or os.environ.get("API_KEY")
if not api_key:
    st.error("APIキーが設定されていません。StreamlitのSecretsに 'API_KEY' を登録してください。")
    st.stop()

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-1.5-flash')

def translate_auto(text):
    if not text.strip(): return ""
    prompt = f"Translate the following English message into natural Japanese: {text}"
    response = model.generate_content(prompt)
    return response.text

def analyze_reply(japanese_reply, context_english):
    system_instruction = """
    You are a professional cross-cultural communication expert. 
    Return a JSON response with:
    - translatedText (English)
    - backTranslation (Japanese literal)
    - isAppropriate (boolean)
    - critique (Japanese explanation)
    - suggestions: list of objects {text, label, backTranslation}
    """
    prompt = f"Context: {context_english}\nReply to analyze: {japanese_reply}"
    response = model.generate_content(
        prompt, 
        generation_config={"response_mime_type": "application/json"},
        tools=[], # Streamlit env might vary, keeping it simple
    )
    try:
        # Some models return text wrapped in markdown
        cleaned_text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(cleaned_text)
    except:
        return None

# UI構成
st.title("🌐 SmartBridge")
st.caption("AIが「相手の意図」と「あなたのニュアンス」を繋ぐ翻訳添削ツール")

col1, col2 = st.columns(2)

with col1:
    st.subheader("1. 相手のメッセージ (English)")
    received_text = st.text_area("英語で入力...", height=150, key="received")
    
    if received_text:
        with st.spinner("翻訳中..."):
            jp_translation = translate_auto(received_text)
            st.info(f"**日本語訳:**\n\n{jp_translation}")

with col2:
    st.subheader("2. あなたの返信 (日本語)")
    reply_text = st.text_area("日本語で入力...", height=150, key="reply")
    
    if st.button("翻訳してチェック ✨", use_container_width=True):
        if not reply_text:
            st.warning("返信内容を入力してください。")
        else:
            with st.spinner("AIが分析中..."):
                result = analyze_reply(reply_text, received_text)
                
                if result:
                    # 添削結果の表示
                    color = "green" if result['isAppropriate'] else "orange"
                    st.markdown(f"""
                        <div style="background-color: {'#ecfdf5' if result['isAppropriate'] else '#fffbeb'}; border: 1px solid {color}; padding: 1rem; border-radius: 0.5rem;">
                            <h4 style="color: {'#065f46' if result['isAppropriate'] else '#92400e'}; margin-top:0;">
                                {'✅ 適切な表現です' if result['isAppropriate'] else '⚠️ 改善のアドバイス'}
                            </h4>
                            <p style="font-size: 0.9rem; color: #334155;">{result['critique']}</p>
                        </div>
                    """, unsafe_allow_html=True)
                    
                    st.divider()
                    
                    # メイン翻訳
                    st.markdown("**🇺🇸 英語への翻訳結果:**")
                    st.code(result['translatedText'], language="text")
                    st.caption(f"🔄 意味の確認 (戻し翻訳): {result['backTranslation']}")
                    
                    st.divider()
                    
                    # 別案
                    st.markdown("**💡 おすすめの別表現:**")
                    for sug in result['suggestions']:
                        with st.container():
                            st.markdown(f"""
                                <div style="background: white; padding: 10px; border-left: 4px solid #6366f1; border-radius: 4px; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                    <span style="font-size: 0.7rem; font-weight: bold; color: #6366f1; text-transform: uppercase;">{sug['label']}</span><br/>
                                    <code style="display: block; padding: 5px 0;">{sug['text']}</code>
                                    <div style="font-size: 0.75rem; color: #64748b; font-style: italic;">🔄 {sug['backTranslation']}</div>
                                </div>
                            """, unsafe_allow_html=True)
                else:
                    st.error("分析に失敗しました。もう一度お試しください。")

st.markdown("---")
st.caption("Powered by Google Gemini AI")
