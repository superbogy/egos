import { Remote } from './remote';

export const tryFn = (caller: (...p: any) => any, ...args: any) => {
  try {
    return caller(...args);
  } catch (err) {
    return { err: true, message: err.message };
  }
};

export const canJson = (obj: object) => {
  if (!obj) {
    return false;
  }
  if (Array.isArray(obj)) {
    return true;
  }
  if (typeof obj === 'object') {
    return true;
  }
  return false;
};

export const toObject = (data: any) => {
  try {
    return JSON.parse(data);
  } catch (err) {
    return data;
  }
};

export const dayMs = 86400 * 1000;

export const getNowDayMs = () => {
  return Math.floor(Date.now() / dayMs) * dayMs;
};

export const geDayMs = (dayTime: number) => {
  return Math.floor(dayTime / dayMs) * dayMs;
};

export const getWeekDayEn = (weekNum: number) => {
  const weeks = ['Mon', 'Tue', 'Wed', 'Tus', 'Fri', 'Sat', 'Sun'];
  return weeks[weekNum - 1] || '';
};

export const getMidDays = (current: number, days: number) => {
  const mid = Math.floor(days / 2);
  let start = Math.floor(current / dayMs) * dayMs - mid * dayMs;
  const res = [];
  const end = start + days * dayMs;
  while (start < end) {
    res.push(start);
    start += dayMs;
  }
  return res;
};

export const buildTree = (
  dataSource: any,
  render = (t: { value: any }) => t.value,
  nodeProps = {},
) => {
  if (!dataSource || !dataSource.length) {
    return [];
  }
  const genNode = (item: { id: string; value: any }) => {
    return {
      key: item.id,
      title: render(item),
      children: [],
      ...nodeProps,
    };
  };
  const tree: any = [];
  const childrenSet = new Set();
  const step = (item: any) => {
    const node = genNode(item);
    if (item.children.length) {
      dataSource
        .filter((child: any) => item.children.includes(child.id))
        .map((child: any) => {
          const cNode = step(child);
          childrenSet.add(child.id);
          node.children.push(cNode);
          return cNode;
        });
    }
    tree.push(node);
    return node;
  };

  dataSource.map((item: any) => {
    step(item);
    return item;
  });

  const res = tree.filter((item: any) => !childrenSet.has(item.key));
  return res;
};

export const invokeRemote = (channel: string, ...args: any[]) => {
  return Remote.Electron.ipcRenderer.invoke(channel, ...args);
};

export const updateTreeData = (list: any[], key: string, children?: any[]) => {
  return list.map((node: any) => {
    if (node.key === key) {
      return {
        ...node,
        children,
      };
    }
    if (node.children) {
      return {
        ...node,
        children: updateTreeData(node.children, key, children),
      };
    }
    return node;
  });
};

export const findCurrentNode = (tree, key) => {
  for (const item of tree) {
    if (item.key === key) {
      return item;
    }
    if (item.children && item.children.length) {
      return findCurrentNode(item.children, key);
    }
  }
};

export const findParentNode = (tree, key, pre = null) => {
  for (const item of tree) {
    if (item.key === key) {
      return pre;
    }
    if (item.children) {
      const res = findParentNode(item.children, key, item);
      if (res) {
        return res;
      }
    }
  }
};

export const getBase64 = (file: Blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
