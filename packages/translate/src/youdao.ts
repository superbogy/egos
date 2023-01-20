import { Translator } from './translator';
import { sha256 } from 'js-sha256';
import qs from 'qs';
import { TranslateParam } from './interface';

function truncate(q: string) {
  const len = q.length;
  if (len <= 20) return q;
  return q.substring(0, 10) + len + q.substring(len - 10, len);
}

export class Youdao extends Translator {
  name = 'youdao';

  langs: Map<string, string>;
  constructor(config: Record<string, any>) {
    super(config);
    this.langs = new Map([
      ['auto', 'auto'],
      ['en', 'en'],
      ['ru', 'ru'],
      ['pt', 'pt'],
      ['es', 'es'],
      ['zh-CN', 'zh-CHS'],
      ['ja', 'ja'],
      ['ko', 'ko'],
      ['fr', 'fr'],
      ['ar', 'ar'],
      ['id', 'id'],
      ['vi', 'vi'],
      ['it', 'it'],
    ]);
  }
  async query({ text, sl, tl }) {
    const salt = new Date().getTime();
    const curTime = Math.round(new Date().getTime() / 1000);
    const str1 =
      this.config.appKey +
      truncate(text) +
      salt +
      curTime +
      this.config.appSecret;
    const sign = sha256(str1);
    const api = this.config.api || 'http://openapi.youdao.com/api';
    const data = {
      q: text,
      appKey: this.config.appKey,
      salt,
      from: this.langs.get(sl),
      to: this.langs.get(tl),
      sign,
      signType: 'v3',
      curtime: curTime,
      ext: 'mp3',
      voice: 0,
      strict: false,
    };
    const result = await this.request(api, {
      method: 'post',
      data: qs.stringify(data),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }).catch((err) => {
      return { errorCode: err.code || 10500 };
    });
    return {
      text,
      sl,
      tl,
      ...result,
    };
  }

  getSupportLanguages() {
    return [...this.langs.keys()];
  }

  async textToSpeech(params: TranslateParam): Promise<string> {
    const { text, tl } = params;
    const standard2custom = {
      en: 'eng',
      ja: 'jap',
      ko: 'ko',
      fr: 'fr',
    };
    const voiceLang = standard2custom[tl];
    if (!voiceLang) {
      return '';
    }
    const queryString = qs.stringify({
      word: text,
      le: voiceLang,
      keyfrom: 'speaker-target',
    });
    const url = this.config.speechUrl || 'http://tts.youdao.com/fanyivoice';
    return `${url}?${queryString}`;
  }
}

export default Youdao;
