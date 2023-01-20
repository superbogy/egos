export interface TranslateParam {
  text: string;
  sl?: string;
  tl?: string;
}

export interface GoogleTranslateResult {
  text: string;
  phonetic: string;
  from: {
    language: {
      didYouMean: boolean;
      iso: string;
    };
    text: {
      autoCorrected: boolean;
      value: string;
      didYouMean: boolean;
    };
  };
  raw: string;
  transfer: string;
}
