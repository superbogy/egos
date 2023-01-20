import { franc } from 'franc-min';
import Axios from 'axios';
import { TranslateParam } from './interface';

const langMap = new Map([
  ['eng', 'en'],
  ['spa', 'es'],
  ['fra', 'fr'],
  ['ita', 'it'],
  ['jpn', 'ja'],
  ['kor', 'ko'],
  ['rus', 'ru'],
  ['cmn', 'zh-CN'],
]);

export const detectLang = (text: string) => {
  const options = { minLength: 1, only: [...langMap.keys()] };
  return langMap.get(franc(text, options)) || 'auto';
};

export const getTransLang = (
  text: string,
  lang: { sl: string; tl: string },
) => {
  const sl = lang.sl
    ? langMap.get(lang.sl) || lang.sl
    : detectLang(text) || 'auto';
  let tl = lang.tl ? langMap.get(lang.tl) || lang.tl : 'auto';
  if (sl === tl && String(sl).toLowerCase() === 'zh-cn') {
    tl = 'en';
  }

  return { sl, tl };
};

export class Translator {
  name = 'unknown';
  config: Record<string, any>;
  constructor(config: Record<string, any>) {
    this.config = config;
  }

  /**
   * get available languages
   */
  getSupportLanguages() {}

  async query({
    text,
    sl,
    tl,
  }: {
    text: string;
    sl: string;
    tl: string;
  }): Promise<any> {}

  /**
   * translate entry
   */
  async translate({ text, sl, tl }: { text: string; sl: string; tl: string }) {
    const queryResult = await this.query({ text, sl, tl });
    return {
      ...queryResult,
      engine: this.name,
    };
  }

  async request(url: string, opts: any): Promise<any> {
    return Axios(url, opts)
      .then((res) => res.data)
      .catch(() => {
        return null;
      });
  }

  /**
   * 如果翻译源提供了单独的检测语言的功能，请实现此接口
   */
  async detect(text: string) {
    return detectLang(text);
  }

  /**
   * text to voice
   * @returns {Promise<null>} 语言文件地址
   */
  textToSpeech(payload: TranslateParam): Promise<any> {
    return Promise.resolve(null);
  }
}
