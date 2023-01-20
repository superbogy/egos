export interface BingConfig {
  lang: string;
  selectionLang: {
    english: boolean;
    chinese: boolean;
    japanese: boolean;
    korean: boolean;
    french: boolean;
    spanish: boolean;
    deutsch: boolean;
    others: boolean;
    matchAll: boolean;
  };
  defaultUnfold: {
    english: boolean;
    chinese: boolean;
    japanese: boolean;
    korean: boolean;
    french: boolean;
    spanish: boolean;
    deutsch: boolean;
    others: boolean;
    matchAll: boolean;
  };
  preferredHeight: number;
  selectionWC: {
    min: number;
    max: number;
  };
  options: {
    tense: boolean;
    phsym: boolean;
    cdef: boolean;
    related: boolean;
    sentence: number;
  };
}

export interface YoudaoConfig {
  api: string;
  speechUrl: string;
  appKey: string;
  appSecret: string;
}

export interface GoogleConfig {
  url: string;
}

export interface CibaConfig {
  url: string;
}
export interface ConfigInterface {
  dictionary: {
    youdao: YoudaoConfig;
    google: {
      url: string;
    };
    bing: BingConfig;
    ciba: CibaConfig;
  };
}
export const config: ConfigInterface = {
  dictionary: {
    youdao: {
      api: 'http://localhost:8000/youdao/api',
      speechUrl: 'http://localhost:8000/yd-voice/fanyivoice',
      appKey: '',
      appSecret: '',
    },
    google: {
      url: 'http://localhost:8000/google/',
    },
    bing: {
      lang: '11000000',
      selectionLang: {
        english: true,
        chinese: true,
        japanese: false,
        korean: false,
        french: false,
        spanish: false,
        deutsch: false,
        others: false,
        matchAll: false,
      },
      defaultUnfold: {
        english: true,
        chinese: true,
        japanese: true,
        korean: true,
        french: true,
        spanish: true,
        deutsch: true,
        others: true,
        matchAll: false,
      },
      preferredHeight: 240,
      selectionWC: {
        min: 1,
        max: 5,
      },
      options: {
        tense: true,
        phsym: true,
        cdef: true,
        related: true,
        sentence: 4,
      },
    },
    ciba: {
      url: 'https://dict-mobile.iciba.com/interface/index.php',
    },
  },
};

export const getDictConfig = (
  name: string,
): BingConfig | YoudaoConfig | GoogleConfig => {
  const dict = String(name).toLowerCase();
  return (config.dictionary as Record<string, any>)[dict];
};
