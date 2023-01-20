import Bing from './bing';
import { Ciba } from './ciba';
import { getDictConfig } from './config';
import Google from './google';
import { getTransLang } from './translator';

const TRANSLATORS = [
  new Bing(getDictConfig(Bing.name)),
  new Google(getDictConfig(Google.name)),
  new Ciba(getDictConfig(Ciba.name)),
];

export default class Adapter {
  static getTranslator(name: string) {
    const cls = TRANSLATORS.find((t) => t.name === name);
    if (cls) {
      return cls;
    }
    return TRANSLATORS[0];
  }

  static translate() {}

  static async translateAll({ text, sl, tl }) {
    const lang = getTransLang(text, { sl, tl });
    const result = await Promise.all(
      TRANSLATORS.map((t) => t.translate({ text, ...lang })),
    );
    return { result, text, ...lang };
  }
}
