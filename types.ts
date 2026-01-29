
export interface TranslationResult {
  translatedText: string;
  originalText: string;
}

export interface Suggestion {
  text: string;
  label: string; // e.g., "より丁寧", "よりカジュアル", "短く簡潔に"
  backTranslation: string; // The back-translation of this specific suggestion
}

export interface CritiqueResult extends TranslationResult {
  isAppropriate: boolean;
  critique: string;
  backTranslation: string; // The generated English translated back to Japanese for verification
  suggestions: Suggestion[];
}

export enum MessageSource {
  RECEIVED = 'RECEIVED',
  REPLY = 'REPLY'
}
