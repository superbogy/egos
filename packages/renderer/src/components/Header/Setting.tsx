import { SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import { MenuItemType } from 'antd/lib/menu/hooks/useItems';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

export default class Setting extends React.Component {
  onMenuClick = (ev: { key: string }) => {
    const { key } = ev;
    console.log('????kkkkkey', ev);
    history.push(`/account/${key}`);
  };

  render() {
    const menus: MenuItemType[] = [
      {
        label: '个人中心',
        key: 'center',
        icon: <UserOutlined />,
      },
      {
        label: '设置',
        key: 'setting',
        icon: <SettingOutlined />,
      },
    ];
    return (
      <Dropdown
        menu={{ items: menus, onClick: this.onMenuClick }}
        trigger={['click']}
        placement="bottom"
      >
        <span className={`${styles.action} ${styles.account}`}>
          <SettingOutlined />
        </span>
      </Dropdown>
    );
  }
}
