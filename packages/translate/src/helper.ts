import DOMPurify from 'dompurify';

export function handleNoResult() {
  return Promise.reject(new Error('NO_RESULT'));
}

export function handleNetWorkError() {
  return Promise.reject(new Error('NETWORK_ERROR'));
}

/**
 * Get chs-chz transform function on-demand.
 * The dict object is huge.
 * @param langCode
 */
export async function getChsToChz(langCode: string) {
  return langCode == null || /zh-TW|zh-HK/i.test(langCode) || 'zh-HK';
}

export const getText = (
  parent: Element | null,
  selector?: string,
  transform?: (t: string) => string,
) => {
  if (!parent) {
    return '';
  }

  const child = selector ? parent.querySelector(selector) : parent;
  if (!child) {
    return '';
  }

  const textContent = child.textContent || '';
  return transform ? transform(textContent) : textContent;
};

export function getFullLink(host: string, el: Element, attr: string) {
  const baseUrl = host.endsWith('/') ? host.slice(0, -1) : host;

  const protocol = baseUrl.startsWith('https') ? 'https:' : 'http:';

  const link = el.getAttribute(attr);
  if (!link) {
    return '';
  }

  if (/^[a-zA-Z0-9]+:/.test(link)) {
    return link;
  }

  if (link.startsWith('//')) {
    return protocol + link;
  }

  if (/^.?\/+/.test(link)) {
    return `${baseUrl}/${link.replace(/^.?\/+/, '')}`;
  }

  return `${baseUrl}/${link}`;
}

const isInternalPage = () => true;

export function isTagName(node: { tagName: string }, tagName: string) {
  return (node.tagName || '').toLowerCase() === tagName.toLowerCase();
}

export function getHTML(parent: Element, attr: any) {
  const {
    mode = 'innerHTML',
    selector,
    transform,
    host,
    config = {
      FORBID_TAGS: ['style'],
      FORBID_ATTR: ['style'],
    },
  } = attr;
  const node = selector ? parent.querySelector(selector) : parent;
  if (!node) {
    return '';
  }

  if (host) {
    const fillLink = (el: Element) => {
      if (el.getAttribute('href')) {
        el.setAttribute('href', getFullLink(host, el, 'href'));
      }
      if (el.getAttribute('src')) {
        el.setAttribute('src', getFullLink(host, el, 'src'));
      }
      if (isInternalPage() && el.getAttribute('srcset')) {
        el.setAttribute(
          'srcset',
          el
            .getAttribute('srcset')
            .replace(/(,| |^)\/\//g, (_, head) => `${head}https://`),
        );
      }
    };

    if (isTagName(node, 'a') || isTagName(node, 'img')) {
      fillLink(node);
    }
    node.querySelectorAll('a').forEach(fillLink);
    node.querySelectorAll('img').forEach(fillLink);
  }

  const fragment = DOMPurify.sanitize(node, {
    ...config,
    RETURN_DOM_FRAGMENT: true,
  });

  const content = fragment.firstChild ? fragment.firstChild[mode] : '';

  return transform ? transform(content) : content;
}

export function getInnerHTML(host, parent, selectorOrConfig = {}) {
  return getHTML(
    parent,
    typeof selectorOrConfig === 'string'
      ? { selector: selectorOrConfig, host, mode: 'innerHTML' }
      : { ...selectorOrConfig, host, mode: 'innerHTML' },
  );
}

let yr = null;
// refer to https://github.com/matheuss/google-translate-token
export const googleSM = (a) => {
  const wr = (p) => {
    return () => {
      return p;
    };
  };
  /* eslint-disable */
  const xr = function (a, b) {
    for (let c = 0; c < b.length - 2; c += 3) {
      let d = b.charAt(c + 2);
      d = 'a' <= d ? d.charCodeAt(0) - 87 : Number(d);
      d = '+' == b.charAt(c + 1) ? a >>> d : a << d;
      a = '+' == b.charAt(c) ? (a + d) & 4294967295 : a ^ d;
    }
    return a;
  };
  let b;
  if (null !== yr) {
    b = yr;
  } else {
    b = wr(String.fromCharCode(84));
    const c = wr(String.fromCharCode(75));
    b = [b(), b()];
    b[1] = c();
    b = (yr = (window as any)[b.join(c())] || '') || '';
  }
  let d: any = wr(String.fromCharCode(116));
  let c: any = wr(String.fromCharCode(107));
  d = [d(), d()];
  d[1] = c();
  c = '&' + d.join('') + '=';
  d = b.split('.');
  b = Number(d[0]) || 0;
  let e = [];
  let f = 0;
  let g = 0;
  while (g < a.length) {
    g++;
    let l = a.charCodeAt(g);
    128 > l
      ? (e[f++] = l)
      : (2048 > l
          ? (e[f++] = (l >> 6) | 192)
          : (55296 == (l & 64512) &&
            g + 1 < a.length &&
            56320 == (a.charCodeAt(g + 1) & 64512)
              ? ((l = 65536 + ((l & 1023) << 10) + (a.charCodeAt(++g) & 1023)),
                (e[f++] = (l >> 18) | 240),
                (e[f++] = ((l >> 12) & 63) | 128))
              : (e[f++] = (l >> 12) | 224),
            (e[f++] = ((l >> 6) & 63) | 128)),
        (e[f++] = (l & 63) | 128));
  }
  a = b;
  for (f = 0; f < e.length; f++) (a += e[f]), (a = xr(a, '+-a^+6'));
  a = xr(a, '+-3^+b+-f');
  a ^= Number(d[1]) || 0;
  0 > a && (a = (a & 2147483647) + 2147483648);
  a %= 1e6;
  return c + (a.toString() + '.' + (a ^ b));
};
