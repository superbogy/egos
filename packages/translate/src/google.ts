import axios from 'axios';
import languages from 'google-translate-api/languages';
import qs from 'qs';
import { path as objPath } from 'ramda';
import { GoogleTranslateResult } from './interface';
import { Translator } from './translator';

const GOOGLE_RPC_IDS = {
  translate: 'MkEWBc',
  volume: 'jQ1olc',
};


export class Google extends Translator {
  name = 'google';
  extract(key: string, body: any) {
    const re = new RegExp(`"${key}":".*?"`);
    const result = re.exec(body);
    if (result !== null) {
      return result[0].replace(`"${key}":"`, '').slice(0, -1);
    }
    return '';
  }

  async getQueryPayload(rpcId: string) {
    const baseUrl = this.config.url || 'https://translate.google.com/';
    const options = {
      method: 'GET',
      url: baseUrl,
    };
    const res = await axios(baseUrl, options);
    return {
      rpcids: rpcId,
      'f.sid': this.extract('FdrFJe', res.data),
      bl: this.extract('cfb2h', res.data),
      hl: 'zh-CN',
      'source-path': '/',
      'soc-app': 1,
      'soc-platform': 1,
      'soc-device': 1,
      _reqid: Math.floor(1000 + Math.random() * 9000),
      rt: 'c',
    };
  }

  async textToSpeech(params: {
    text: string;
    lang: string;
    meta: any;
  }): Promise<any> {
    const { text, lang, meta } = params;
    const query = meta || (await this.getQueryPayload(GOOGLE_RPC_IDS.volume));
    const baseUrl = this.config.url || 'https://translate.google.com/';
    const apiPath = '_/TranslateWebserverUi/data/batchexecute?';
    const url = [baseUrl, apiPath, qs.stringify(query)].join('');
    const payload = encodeURIComponent(
      JSON.stringify([
        [['jQ1olc', `["${text}","${lang}",null,"null"]`, null, 'generic']],
      ]),
    );
    const resVolume = await axios({
      method: 'POST',
      url,
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      data: `f.req=${payload}`,
    });
    const jQ1olc = resVolume.data.match(/jQ1olc","\[\\"(.*)\\"]/);
    if (jQ1olc) {
      const [, dd] = jQ1olc[1];
      return { lang, text, volume: `data:audio/ogg;base64,${dd}` };
    }
    return { lang, text, volume: '' };
  }

  async query({
    text,
    sl,
    tl,
    options,
  }: {
    text: string;
    sl: string;
    tl: string;
    options?: any;
  }) {
    const opts: Record<string, string> = {};
    const reqOpts = options || { headers: {} };
    [sl, tl].forEach((lang) => {
      if (lang && !languages.isSupported(lang)) {
        throw new Error(`The language ${lang} is not supported`);
      }
    });
    opts.from = sl || 'en';
    opts.to = tl || 'zh-cn';
    opts.tld = this.config.tld || 'com';
    const baseUrl = this.config.url || 'https://translate.google.cn/';
    const query = await this.getQueryPayload(GOOGLE_RPC_IDS.translate);
    const uriPath = '_/TranslateWebserverUi/data/batchexecute?';
    const url = [baseUrl, uriPath, qs.stringify(query)].join('');
    const payload = JSON.stringify([
      [
        [
          GOOGLE_RPC_IDS.translate,
          JSON.stringify([[text, opts.from, opts.to, true], [null]]),
          null,
          'generic',
        ],
      ],
    ]);
    reqOpts.data = `f.req=${encodeURIComponent(payload)}&`;
    reqOpts.headers['content-type'] =
      'application/x-www-form-urlencoded;charset=UTF-8';
    const res = await axios({ ...reqOpts, url, method: 'POST' })
      .then((transRes) => {
        let json: string = transRes.data.slice(6);
        const result: GoogleTranslateResult = {
          text,
          phonetic: '',
          from: {
            language: {
              didYouMean: false,
              iso: '',
            },
            text: {
              autoCorrected: false,
              value: '',
              didYouMean: false,
            },
          },
          raw: '',
          transfer: '',
        };
        try {
          const len = (/^\d+/.exec(json) as any[])[0];
          json = JSON.parse(
            json.slice(len.length, parseInt(len, 10) + len.length),
          );
          json = JSON.parse(json[0][2]);
          result.raw = json;
        } catch (e) {
          return result;
        }

        const transfer = objPath([1, 0, 0, 5], json);
        if (!transfer) {
          // translation not found, could be a hyperlink or gender-specific translation?
          result.transfer = objPath([1, 0, 0, 0], json);
        } else {
          result.transfer = transfer
            .map((obj: any[]) => {
              return obj[0];
            })
            .filter(Boolean)
            // Google api seems to split text per sentences by <dot><space>
            // So we join text back with spaces.
            // See: https://github.com/vitalets/google-translate-api/issues/73
            .join(' ');
        }
        result.phonetic = objPath([1, 0, 0, 1], json); // [1][0][0][1];
        // From language
        if (objPath([0, 1, 1], json)) {
          result.from.language.didYouMean = true;
          result.from.language.iso = objPath([0, 1, 1, 0], json); // json[0][1][1][0];
        } else if (objPath([1, 3], json) === 'auto') {
          result.from.language.iso = objPath([2], json);
        } else {
          result.from.language.iso = objPath([1, 3], json);
        }

        // Did you mean & autocorrect
        if (objPath([0, 1, 0], json) && json[0][1][0]) {
          let str = objPath([0, 1, 0, 0, 1], json) || '';

          str = str.replace(/<b>(<i>)?/g, '[');
          str = str.replace(/(<\/i>)?<\/b>/g, ']');
          result.from.text.value = str;
          if (objPath([0, 1, 0, 2], json) === 1) {
            result.from.text.autoCorrected = true;
          } else {
            result.from.text.didYouMean = true;
          }
        }
        return result;
      })
      .catch((err) => {
        return { err: err.message };
      });
    return { result: res };
  }
}

export default Google;
