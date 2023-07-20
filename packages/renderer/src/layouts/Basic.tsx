import RightContent from '@/components/Header/RightContent';
// import Translator from '@/components/Translator';
import { Dispatch, Outlet, useLocation, Link, connect } from 'umi';
import Icon, {
  FileImageOutlined,
  FolderOutlined,
  HighlightOutlined,
  NodeIndexOutlined,
  RestOutlined,
  SwapOutlined,
  CameraFilled,
} from '@ant-design/icons';
import { Layout, Menu, Popover } from 'antd';
import { useEffect } from 'react';
import router from '../../config/router';
import './index.less';
import logo from '@/assets/logo.svg';
import styles from './basic.less';
import { MenuItemType } from 'antd/lib/menu/hooks/useItems';

const { Sider } = Layout;
const routeIcons: Record<string, any> = {
  FolderOutlined,
  FileImageOutlined,
  HighlightOutlined,
  NodeIndexOutlined,
  RestOutlined,
  SwapOutlined,
  CameraFilled,
};

/**
 * use Authorized check all menu item
 */
// const menuDataRender: MenuProps['items'] = (menuList: MenuItemProps[]) => {
//   return menuList.map((item: MenuItemProps) => {
//     const localItem = {
//       ...item,
//       key: item.path,
//       children: item.children ? menuDataRender(item.children) : undefined,
//     };
//     return localItem;
//   });
// };

interface LayoutProps {
  dispatch: Dispatch;
  global: {
    translateResult: any;
    translateVisible: boolean;
    translator: string;
  };
}

export default connect(({ global, dispatch }: LayoutProps) => ({
  global,
  dispatch,
}))((props: LayoutProps) => {
  const { dispatch } = props;
  const location = useLocation();
  console.log(location);
  // const { translateResult, translateVisible, translator } = props.global;
  // const colors = {
  //   done: { color: 'green', icon: <CheckCircleOutlined /> },
  //   pending: { color: 'blue', icon: <ClockCircleOutlined /> },
  //   processing: { color: '#2db7f5', icon: <SyncOutlined /> },
  //   unresolved: { color: '#f50', icon: <CloseCircleOutlined /> },
  // };
  useEffect(() => {
    if (dispatch) {
      dispatch({
        type: 'global/init',
        payload: {},
      });
    }
  }, []);

  // const handleTransCancel = () => {
  //   dispatch({
  //     type: 'global/updateState',
  //     payload: {
  //       translateVisible: false,
  //     },
  //   });
  // };
  const menuItems: MenuItemType[] = router.routes
    .filter((item) => item.icon)
    .map((item) => {
      return {
        key: item.path,
        style: { padding: 0, textAlign: 'center' },
        label: (
          <Popover placement="right" content={item.name}>
            <Link to={item.path as string}>
              <Icon component={routeIcons[item.icon as string]} />
            </Link>
          </Popover>
        ),
      } as MenuItemType;
    });
  return (
    <Layout style={{ height: '100%' }}>
      <Sider
        theme="dark"
        width={64}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          paddingTop: 32,
        }}
      >
        <div className={styles.logoBox}>
          <Link to="/">
            <img alt="logo" className={styles.logo} src={logo} />
          </Link>
        </div>
        <Menu
          style={{ flex: 'auto', padding: '0' }}
          theme="dark"
          mode="inline"
          inlineCollapsed={true}
          defaultSelectedKeys={['4']}
          items={menuItems}
          overflowedIndicator={<span />}
        />
      </Sider>
      <Layout style={{ marginLeft: 64 }}>
        <Layout.Header style={{ background: '#fefefe', height: 45 }}>
          <RightContent menu={true} theme="light" />
        </Layout.Header>
        <Layout.Content
          className="main"
          style={{ height: '100%', overflow: 'overflow' }}
        >
          <Outlet />
          {/* <Translator
            visible={translateVisible}
            onCancel={handleTransCancel}
            onOk={handleTransCancel}
            cancelText="close"
            mask={false}
            maskClosable={true}
            okText="copy"
            data={translateResult}
            okButtonProps={{ type: 'ghost', icon: <CopyOutlined /> }}
            position={translator}
          /> */}
        </Layout.Content>
      </Layout>
    </Layout>
  );
});
