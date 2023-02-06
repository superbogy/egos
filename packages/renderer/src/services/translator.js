import Youdao from '@opentranslate/youdao';
import Google from '@opentranslate/google';
import { getTransLang } from '@/lib/translate/translator';
import Adapter from '@/lib/translate';

const translators = {
  youdao: new Youdao({
    config: {
      appKey: '67a59596dd4e0ec4',
      key: '0gzexJa8mepVZuqxjguRqqtDGci6G26w',
    },
  }),
  google: new Google(),
};
export const translate = async ({ text, sl, tl }) => {
  return Adapter.translateAll({ sl, tl, text });
};
