import axios from 'axios';
import qs from 'qs';
import { TranslateParam } from './interface';
import { Translator } from './translator';

export class Ciba extends Translator {
  public name: string = 'ciba';
  async query({ text }: TranslateParam) {
    const query = {
      c: 'world',
      m: 'getsuggest',
      is_need_mean: 1,
      word: text,
      nums: 10,
    };
    const res = await axios({
      method: 'get',
      url: [this.config.url, qs.stringify(query)].join('?'),
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
    });
    const result = res.data;
    if (result.status !== 1) {
      return { engine: this.name, result: [] };
    }
    return { engine: this.name, result: result.message };
  }
}
