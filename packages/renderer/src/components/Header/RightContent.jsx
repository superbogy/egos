import { Tooltip, Tag, Select, Dropdown } from 'antd';
import { QuestionCircleOutlined, TranslationOutlined } from '@ant-design/icons';
import React from 'react';
import { connect, SelectLang } from 'umi';
import HeaderSearch from './Search';
import styles from './index.less';

const GlobalHeaderRight = (props) => {
  const { theme, layout } = props;
  let className = styles.right;

  if (theme === 'dark' && layout === 'top') {
    className = `${styles.right}  ${styles.dark}`;
  }

  return (
    <div className={className}>
      <HeaderSearch
        className={`${styles.action} ${styles.search}`}
        placeholder="搜索"
        defaultValue="e album"
        options={[
          {
            label: <a href="https://umijs.org/zh/guide/umi-ui.html">umi ui</a>,
            value: 'umi ui',
          },
          {
            label: <a href="next.ant.design">Ant Design</a>,
            value: 'Ant Design',
          },
          {
            label: <a href="https://protable.ant.design/">Pro Table</a>,
            value: 'Pro Table',
          },
          {
            label: <a href="https://prolayout.ant.design/">Pro Layout</a>,
            value: 'Pro Layout',
          },
        ]}
      />
      <Tooltip title="使用文档">
        <a
          style={{
            color: 'inherit',
          }}
          target="_blank"
          href="https://github.com/superbogy/egos"
          rel="noopener noreferrer"
          className={styles.action}
        >
          <QuestionCircleOutlined />
        </a>
      </Tooltip>
      <div>
        <Dropdown
          trigger="click"
          menu={{
            items: [
              {
                label: '中文',
                key: 'cn-zh',
              },
              {
                label: 'English',
                key: 'en',
              },
            ],
          }}
        >
          <span>
            <TranslationOutlined />
          </span>
        </Dropdown>
      </div>
    </div>
  );
};

export default connect(({ setting }) => ({
  theme: setting.navTheme,
  layout: setting.layout,
}))(GlobalHeaderRight);
