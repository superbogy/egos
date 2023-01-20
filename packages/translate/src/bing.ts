import {
  handleNoResult,
  handleNetWorkError,
  getText,
  getInnerHTML,
  getChsToChz,
} from './helper';
import axios from 'axios';
import { Translator } from './translator';

export const getSrcPage = (text: string) =>
  `http://localhost:8000/dict/search?q=${encodeURIComponent(
    text.replace(/\s+/g, ' '),
  )}`;

export function fetchDirtyDOM(url: string, options = {}) {
  return axios(url, {
    withCredentials: false,
    ...options,
    transformResponse: [(data) => data],
    responseType: 'document',
  }).then(({ data }) => {
    return data;
  });
}

const HOST = 'http://localhost:8000/bing';

const DICT_LINK =
  'http://localhost:8000/bing/dict/clientsearch?mkt=zh-CN&setLang=zh&form=BDVEHC&ClientVer=BDDTV3.5.1.4320&q=';

/** Lexical result */
export interface BingResultLex {
  type: string;
  title: string;
  /** phonetic symbols */
  phsym?: {
    /** Phonetic Alphabet, UK|US|PY */
    lang: string;
    /** pronunciation */
    pron: string;
  }[];
  /** common definitions */
  cdef?: {
    pos: string;
    def: string;
  }[];
  /** infinitive */
  infs?: string[];
  sentences?: {
    en: string;
    chs: string;
    source: string;
    mp3: string;
  }[];
}

/** Alternate machine translation result */
export const BingResultMachine = {
  type: 'machine',
  /** machine translation */
  mt: 'string',
};

/** Alternate result */
export interface BingResultRelated {
  type: string;
  title: string;
  defs: {
    title: string;
    meanings: {
      href: string;
      word: string;
      def: string;
    }[];
  }[];
}

function handleLexResult(doc: any, options, transform) {
  const searchResult: {
    result: BingResultLex;
    audio?: Record<string, any>;
  } = {
    result: {
      type: 'lex',
      title: getText(doc, '.client_def_hd_hd', transform),
    },
  };

  // pronunciation
  const pronunciation = Array.from(
    doc.querySelectorAll('.client_def_hd_pn_list'),
  );
  searchResult.result.phsym = pronunciation.map((el: any) => {
    let pron = '';
    const $audio = el.querySelector('.client_aud_o');
    if ($audio) {
      [pron] = ($audio.getAttribute('onclick') || '').match(/https.*\.mp3/) || [
        '',
      ];
    }
    return {
      lang: getText(el, '.client_def_hd_pn') as string,
      pron,
    } as { lang: string; pron: string };
  });

  searchResult.audio = searchResult.result.phsym.reduce(
    (audio, { lang, pron }) => {
      const res = { ...audio } as { uk: string; us: string };
      if (/us|美/i.test(lang)) {
        res.us = pron;
      } else if (/uk|英/i.test(lang)) {
        res.uk = pron;
      }
      return res;
    },
    {},
  );

  // definitions
  const $container = doc.querySelector('.client_def_container');
  if ($container) {
    const $defs = Array.from($container.querySelectorAll('.client_def_bar'));
    if ($defs.length > 0) {
      searchResult.result.cdef = $defs.map((el: any) => ({
        pos: getText(el, '.client_def_title_bar', transform),
        def: getText(el, '.client_def_list', transform),
      }));
    }
  }

  // tense
  const $infs = Array.from(doc.querySelectorAll('.client_word_change_word'));
  if ($infs.length > 0) {
    searchResult.result.infs = $infs.map((el: any) =>
      (el.textContent || '').trim(),
    );
  }

  const $sens = doc.querySelectorAll('.client_sentence_list') || [];
  const sentences: { en: string; chs: string; source: string; mp3: string }[] =
    [];
  /* eslint-disable */
  Array.from($sens).map((el: any) => {
    let mp3 = '';
    const $audio = el.querySelector('.client_aud_o');
    if ($audio) {
      [mp3] = ($audio.getAttribute('onclick') || '').match(/https.*\.mp3/) || [
        '',
      ];
    }
    el.querySelectorAll('.client_sen_en_word').forEach(($word) => {
      $word.outerHTML = getText($word);
    });
    el.querySelectorAll('.client_sen_cn_word').forEach(($word) => {
      $word.outerHTML = getText($word, transform);
    });
    el.querySelectorAll('.client_sentence_search').forEach(($word) => {
      $word.outerHTML = `<span class="dictBing-SentenceItem_HL">${getText(
        $word,
      )}</span>`;
    });
    sentences.push({
      en: getInnerHTML(HOST, el, '.client_sen_en'),
      chs: getInnerHTML(HOST, el, {
        selector: '.client_sen_cn',
        transform,
      }),
      source: getText(el, '.client_sentence_list_link'),
      mp3,
    });
    return el;
  });
  searchResult.result.sentences = sentences;

  if (Object.keys(searchResult.result).length > 2) {
    return searchResult;
  }
  return handleNoResult();
}

function handleMachineResult(doc, transform) {
  const mt = getText(doc, '.client_sen_cn', transform);

  if (mt) {
    return {
      result: {
        type: 'machine',
        mt,
      },
    };
  }

  return handleNoResult();
}

function handleRelatedResult(doc, config, transform) {
  const searchResult: { result: BingResultRelated } = {
    result: {
      type: 'related',
      title: getText(doc, '.client_do_you_mean_title_bar', transform),
      defs: [],
    },
  };

  doc.querySelectorAll('.client_do_you_mean_area').forEach(($area) => {
    const $defsList = $area.querySelectorAll('.client_do_you_mean_list');
    if ($defsList.length > 0) {
      searchResult.result.defs.push({
        title: getText($area, '.client_do_you_mean_title', transform),
        meanings: Array.from($defsList).map(($list: Element) => {
          const word = getText(
            $list,
            '.client_do_you_mean_list_word',
            transform,
          );
          return {
            href: `http://localhost:8000/bing/dict/search?q=${word}`,
            word,
            def: getText($list, '.client_do_you_mean_list_def', transform),
          };
        }),
      });
    }
  });

  if (searchResult.result.defs.length > 0) {
    return searchResult;
  }
  return handleNoResult();
}

export const search = (
  text: string,
  { sl, tl }: { sl: string; tl: string },
  bingConfig: any,
  payload?: any,
) => {
  return fetchDirtyDOM(
    DICT_LINK + encodeURIComponent(text.replace(/\s+/g, ' ')),
  )
    .catch(handleNetWorkError)
    .then(async (doc) => {
      const transform = null;

      if (doc.querySelector('.client_def_hd_hd')) {
        return handleLexResult(doc, bingConfig.options, transform);
      }

      if (doc.querySelector('.client_trans_head')) {
        return handleMachineResult(doc, transform);
      }

      if (bingConfig.options.related) {
        if (doc.querySelector('.client_do_you_mean_title_bar')) {
          return handleRelatedResult(doc, bingConfig, transform);
        }
      }

      return handleNoResult();
    });
};

export class Bing extends Translator {
  public name: string = 'bing';
  async query({ text, sl, tl }) {
    const result = await search(text, { sl, tl }, this.config);
    return {
      text,
      sl,
      tl,
      ...result,
    };
  }

  getSupportLanguages() {
    return [];
  }
}

export default Bing;
