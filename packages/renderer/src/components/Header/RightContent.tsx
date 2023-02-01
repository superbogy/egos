import { Tooltip, Dropdown, Button } from 'antd';
import { GlobalOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { connect } from 'umi';
import HeaderSearch from './Search';
import styles from './index.less';
import classNames from 'classnames';
import AvatarDropdown from './Setting';
import { useClock } from 'react-use-clock';
import moment from 'moment';
import './clock.css';

type SettingProps = {
  theme: string;
  lang: string;
};
interface HeaderRightProps {
  theme: string;
  setting: SettingProps;
}

const GlobalHeaderRight: React.FC<SettingProps> = (props) => {
  const { theme } = props;
  const clock = useClock();
  return (
    <div className={classNames(styles.right, { dark: theme === 'dark' })}>
      <HeaderSearch
        className={`${styles.action} ${styles.search}`}
        placeholder="search"
        defaultValue="2g album"
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
      <div className={styles.menuItem}>
        <Dropdown
          trigger={['click']}
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
            <Button icon={<GlobalOutlined />} type="text">
              en
            </Button>
          </span>
        </Dropdown>
      </div>
      <div className={styles.menuItem}>
        <AvatarDropdown />
      </div>
      <Tooltip
        title={
          <span>
            {moment().format('YYYY-MM-DD')}
            &nbsp;
            {clock.hours.toString().padStart(2, '0')}:
            {clock.minutes.toString().padStart(2, '0')}:
            {clock.seconds.toString().padStart(2, '0')}
          </span>
        }
      >
        <div className={classNames(styles.menuItem, styles.clock)}>
          <div
            className="clock-timer"
            style={
              {
                '--hours': `${clock.hours}`,
                '--minutes': `${clock.minutes}`,
                '--seconds': `${clock.seconds}`,
                width: 24,
                height: 24,
              } as any
            }
          >
            <span className="clock__hours" />
            <span className="clock__minutes" />
            <span className="clock__seconds" />
          </div>
        </div>
      </Tooltip>
    </div>
  );
};

export default connect(({ setting }: HeaderRightProps) => ({
  theme: setting.theme,
  lang: setting.lang,
}))(GlobalHeaderRight);
