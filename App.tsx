
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CopyButton from './components/CopyButton';
import { translateAuto, translateAndCritique } from './services/geminiService';
import { CritiqueResult } from './types';

const App: React.FC = () => {
  // Received Message State
  const [receivedText, setReceivedText] = useState('');
  const [receivedTranslated, setReceivedTranslated] = useState('');
  const [isTranslatingReceived, setIsTranslatingReceived] = useState(false);

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [critiqueResult, setCritiqueResult] = useState<CritiqueResult | null>(null);
  const [isProcessingReply, setIsProcessingReply] = useState(false);

  // Auto-translation for received message (Debounced)
  useEffect(() => {
    if (!receivedText.trim()) {
      setReceivedTranslated('');
      return;
    }

    const timer = setTimeout(async () => {
      setIsTranslatingReceived(true);
      const translated = await translateAuto(receivedText);
      setReceivedTranslated(translated);
      setIsTranslatingReceived(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [receivedText]);

  const handleProcessReply = async () => {
    if (!replyText.trim()) return;

    setIsProcessingReply(true);
    try {
      const result = await translateAndCritique(replyText, receivedText);
      setCritiqueResult(result);
    } catch (error) {
      alert("処理中にエラーが発生しました。");
    } finally {
      setIsProcessingReply(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Received Message Column */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
              1. 相手からのメッセージ (English)
            </label>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <textarea
                value={receivedText}
                onChange={(e) => setReceivedText(e.target.value)}
                placeholder="相手から届いた英語の文章を入力してください..."
                className="w-full h-40 p-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="bg-slate-50 p-4 border-t border-slate-100 min-h-[100px] relative">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500">日本語訳 (自動)</span>
                  <div className="flex items-center space-x-2">
                    {isTranslatingReceived && (
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                    )}
                    {receivedTranslated && <CopyButton text={receivedTranslated} />}
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {receivedTranslated || "相手の言葉を入れるとここに日本語訳が表示されます。"}
                </p>
              </div>
            </div>
          </div>

          {/* Reply Message Column */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
              2. あなたの返信 (日本語)
            </label>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="送りたい返信を日本語で入力してください..."
                className="w-full h-40 p-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none border-b border-slate-100"
              />
              <div className="p-4 bg-white flex justify-end">
                <button
                  onClick={handleProcessReply}
                  disabled={isProcessingReply || !replyText.trim()}
                  className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-all shadow-md ${
                    isProcessingReply || !replyText.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 active:transform active:scale-95 shadow-indigo-200'
                  }`}
                >
                  {isProcessingReply ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>分析中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                      <span>翻訳してチェック</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Critique Display */}
            {critiqueResult && (
              <div className={`rounded-xl border p-6 transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-sm ${
                critiqueResult.isAppropriate ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-start space-x-3 mb-6">
                  <div className={`p-1.5 rounded-full shadow-sm shrink-0 ${critiqueResult.isAppropriate ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    {critiqueResult.isAppropriate ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${critiqueResult.isAppropriate ? 'text-emerald-900' : 'text-amber-900'}`}>
                      {critiqueResult.isAppropriate ? '適切な表現です' : '改善のアドバイス'}
                    </h3>
                    <p className={`text-sm mt-1 leading-relaxed ${critiqueResult.isAppropriate ? 'text-emerald-800' : 'text-amber-800'}`}>
                      {critiqueResult.critique}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Primary Translation & Back-translation */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">英語への翻訳結果</span>
                      <CopyButton text={critiqueResult.translatedText} />
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm font-medium text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {critiqueResult.translatedText}
                    </div>
                    {/* Back Translation */}
                    <div className="bg-slate-200/50 p-3 rounded-lg border border-slate-200 border-dashed">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                        意味の確認 (戻し翻訳)
                      </div>
                      <p className="text-xs text-slate-600 italic leading-relaxed">
                        {critiqueResult.backTranslation}
                      </p>
                    </div>
                  </div>

                  {/* Suggestions with Labels and Back-translations */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block mb-3">おすすめの別表現</span>
                    <div className="space-y-4">
                      {critiqueResult.suggestions.map((suggestion, idx) => (
                        <div key={idx} className="group relative bg-white/70 hover:bg-white/95 px-4 py-4 rounded-xl border border-slate-100 transition-all shadow-sm">
                          <div className="flex flex-col space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                                {suggestion.label}
                              </span>
                              <CopyButton text={suggestion.text} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            
                            <div className="text-slate-800 text-sm font-semibold leading-relaxed pr-8">
                              "{suggestion.text}"
                            </div>

                            {/* Suggestion Back Translation */}
                            <div className="mt-1 flex items-start space-x-2 text-slate-500">
                               <svg className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              <span className="text-[11px] italic leading-tight">
                                {suggestion.backTranslation}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <h2 className="text-xl font-bold text-slate-800 mb-2">SmartBridge の仕組み</h2>
          <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-sm">
            AIが相手の言葉とあなたの返信を照らし合わせ、単なる翻訳を超えた「コミュニケーションの質」を提案します。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-10">
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full font-bold text-xl">✓</div>
              <div>
                <p className="text-sm font-semibold text-slate-700">戻し翻訳で安心</p>
                <p className="text-xs text-slate-400 mt-1 leading-normal">全ての提案に日本語の意味がつくので、自信を持って送信できます。</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full font-bold text-xl">⚡</div>
              <div>
                <p className="text-sm font-semibold text-slate-700">シーン別の別案</p>
                <p className="text-xs text-slate-400 mt-1 leading-normal">「丁寧」から「カジュアル」まで、状況に合わせた最適な一言が見つかります。</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full font-bold text-xl">📋</div>
              <div>
                <p className="text-sm font-semibold text-slate-700">ワンクリックコピー</p>
                <p className="text-xs text-slate-400 mt-1 leading-normal">気に入った表現はすぐにコピーして使えます。改行もそのまま維持されます。</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-slate-400 text-sm">
        &copy; 2024 SmartBridge Translation App. Powered by Gemini AI.
      </footer>
    </div>
  );
};

export default App;
