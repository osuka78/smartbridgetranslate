
import streamlit as st
import google.generativeai as genai
import json
import os

# ページ設定
st.set_page_config(page_title="SmartBridge - AI翻訳添削", layout="wide", page_icon="🌐")

# スタイル調整
st.markdown("""
    <style>
    .main { background-color: #f8fafc; }
    .stTextArea textarea { font-size: 1rem; border-radius: 0.5rem; }
    .stButton button { border-radius: 0.5rem; font-weight: 600; }
    .suggestion-card { background: white; padding: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
    </style>
""", unsafe_allow_html=True)

# APIキーの設定
api_key = st.secrets.get("API_KEY") or os.environ.get("API_KEY")

if not api_key:
    st.error("⚠️ APIキーが見つかりません。Streamlit Cloudの 'Settings > Secrets' に API_KEY を設定してください。")
    st.info("設定例:\nAPI_KEY = \"your-api-key-here\"")
    st.stop()

genai.configure(api_key=api_key)

# 優先順位に基づいたモデルリスト
FALLBACK_MODELS = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash",
    "gemini-2.5-flash-preview-09-2025",
    "gemini-flash-latest",
    "gemini-2.0-flash"
]

def generate_content_with_fallback(prompt, config=None, system_instruction=None):
    """
    リミットやエラー時にモデルを自動で切り替える共通関数
    """
    last_error = None
    for model_name in FALLBACK_MODELS:
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt, generation_config=config)
            return response
        except Exception as e:
            last_error = e
            # ログに記録（StreamlitのManage appで確認可能）
            print(f"Model {model_name} failed: {e}")
            continue
    raise last_error

def translate_auto(text):
    if not text.strip(): return ""
    prompt = f"Translate the following English message into natural, friendly Japanese. Text: {text}"
    try:
        response = generate_content_with_fallback(prompt)
        return response.text
    except Exception as e:
        return f"翻訳エラー: 複数のモデルで試行しましたが失敗しました。内容: {str(e)}"

def analyze_reply(japanese_reply, context_english):
    system_instruction = """
    You are a professional cross-cultural communication expert. 
    Analyze the reply and return ONLY a JSON object with these keys:
    - translatedText: String (Natural English translation)
    - backTranslation: String (Literal Japanese translation of your English result)
    - isAppropriate: Boolean (Is it socially appropriate for the context?)
    - critique: String (Brief advice in Japanese)
    - suggestions: List of objects {text, label, backTranslation}
    """
    prompt = f"Context (English): {context_english}\nUser's Japanese Reply: {japanese_reply}"
    config = {"response_mime_type": "application/json"}
    
    try:
        response = generate_content_with_fallback(
            prompt, 
            config=config, 
            system_instruction=system_instruction
        )
        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        return json.loads(raw_text)
    except Exception as e:
        st.error(f"分析エラー: {str(e)}")
        return None

# UI構成
st.title("🌐 SmartBridge")
st.caption("AIが「相手の意図」と「あなたのニュアンス」を繋ぐ翻訳添削ツール")

col1, col2 = st.columns(2)

with col1:
    st.subheader("1. 相手のメッセージ (English)")
    received_text = st.text_area("英語メッセージを貼り付け...", height=150, key="received", placeholder="Hello, I was wondering if we could...")
    
    if received_text:
        with st.status("翻訳中...", expanded=False) as status:
            jp_translation = translate_auto(received_text)
            status.update(label="翻訳完了", state="complete", expanded=True)
            st.info(f"**日本語訳:**\n\n{jp_translation}")

with col2:
    st.subheader("2. あなたの返信 (日本語)")
    reply_text = st.text_area("日本語で返信を作成...", height=150, key="reply", placeholder="承知いたしました。ぜひ検討させてください。")
    
    if st.button("翻訳してチェック ✨", use_container_width=True):
        if not reply_text:
            st.warning("返信内容を入力してください。")
        elif not received_text:
            st.warning("先に相手のメッセージ（文脈）を入力してください。")
        else:
            with st.spinner("AIがコミュニケーションを分析中..."):
                result = analyze_reply(reply_text, received_text)
                
                if result:
                    # 添削結果の表示
                    color = "emerald" if result.get('isAppropriate') else "orange"
                    bg_color = "#ecfdf5" if result.get('isAppropriate') else "#fffbeb"
                    border_color = "#10b981" if result.get('isAppropriate') else "#f59e0b"
                    
                    st.markdown(f"""
                        <div style="background-color: {bg_color}; border: 1px solid {border_color}; padding: 1.25rem; border-radius: 0.75rem; margin-bottom: 1.5rem;">
                            <h4 style="color: {'#065f46' if result.get('isAppropriate') else '#92400e'}; margin-top:0;">
                                {'✅ 適切な表現です' if result.get('isAppropriate') else '⚠️ 改善のアドバイス'}
                            </h4>
                            <p style="font-size: 0.95rem; color: #334155; line-height: 1.5;">{result.get('critique', '')}</p>
                        </div>
                    """, unsafe_allow_html=True)
                    
                    # メイン翻訳
                    st.write("**🇺🇸 英語への翻訳結果:**")
                    st.code(result.get('translatedText', ''), language="text")
                    st.caption(f"🔄 意味の確認 (戻し翻訳): {result.get('backTranslation', '')}")
                    
                    st.divider()
                    
                    # 別案
                    st.write("**💡 おすすめの別表現:**")
                    for sug in result.get('suggestions', []):
                        st.markdown(f"""
                            <div style="background: white; padding: 12px; border-left: 4px solid #6366f1; border-radius: 4px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <span style="font-size: 0.7rem; font-weight: 800; color: #6366f1; text-transform: uppercase; letter-spacing: 0.05em;">{sug['label']}</span><br/>
                                <div style="padding: 8px 0; font-weight: 500;">{sug['text']}</div>
                                <div style="font-size: 0.8rem; color: #64748b; font-style: italic;">🔄 {sug['backTranslation']}</div>
                            </div>
                        """, unsafe_allow_html=True)
                else:
                    st.error("分析に失敗しました。複数のモデルを試行しましたが、制限に達したか接続エラーが発生しました。")

st.markdown("---")
st.caption("Powered by Google Gemini Multi-Model Fallback System. Built with Streamlit.")
