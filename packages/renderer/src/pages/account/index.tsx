import { useState } from 'react';
import { Menu } from 'antd';
import { connect, Dispatch, history } from 'umi';
import BaseView from './components/base';
import BindingView from './components/binding';
import NotificationView from './components/notification';
import SecurityView from './components/security';
// import Translate from './components/Translate';
import styles from './style.less';

const { Item } = Menu;
const menuMap: Record<string, string> = {
  base: 'Basic',
  security: 'Security',
  storage: 'Storage',
  translator: 'Translator',
  notification: 'Notification',
};
interface AccountProps {
  dispatch: Dispatch;
  account: any;
}
const Index: React.FC<AccountProps> = (props: AccountProps) => {
  console.log('fuck account');
  const { account, dispatch } = props;
  const [activeKey, setActiveKey] = useState('base');
  const getMenu = () => {
    return Object.keys(menuMap).map((item) => (
      <Item key={item}>{menuMap[item]}</Item>
    ));
  };
  const onActive = (key: string) => {
    setActiveKey(key);
  };

  const handleBucketUpdate = (bucket: any) => {
    if (!bucket) {
      return;
    }
    dispatch({
      type: 'account/updateBucket',
      payload: {
        bucket,
      },
    });
  };

  const renderChildren = () => {
    switch (activeKey) {
      case 'base':
        return <BaseView />;
      case 'security':
        return <SecurityView />;
      case 'storage':
        return (
          <BindingView
            drivers={account.drivers}
            buckets={account.buckets}
            onBucketChange={handleBucketUpdate}
          />
        );
      // case 'translator':
      //   return <Translate />;
      case 'notification':
        return <NotificationView />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.main}>
        <div className={styles.leftMenu}>
          <Menu
            mode="inline"
            selectedKeys={[activeKey]}
            onClick={({ key }) => {
              onActive(key);
            }}
          >
            {getMenu()}
          </Menu>
        </div>
        <div className={styles.right}>
          <div className={styles.title}>{menuMap[activeKey]}</div>
          {renderChildren()}
        </div>
      </div>
    </>
  );
};
export default connect(({ account, dispatch }) => ({ account, dispatch }))(
  Index,
);
