import RightContent from '@/components/Header/RightContent';
// import Translator from '@/components/Translator';
import { Outlet } from 'umi';
import Icon, {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  FileImageOutlined,
  FolderOutlined,
  HighlightOutlined,
  NodeIndexOutlined,
  RestOutlined,
  SwapOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Layout, Menu, Popover } from 'antd';
import { useEffect, useRef } from 'react';
import { useModel, Link, connect, useClientLoaderData } from 'umi';
import router from '../../config/router';
import './index.less';
import logo from '@/assets/logo.svg';
import styles from './basic.less';

const { Sider } = Layout;
const routeIcons = {
  FolderOutlined,
  FileImageOutlined,
  HighlightOutlined,
  NodeIndexOutlined,
  RestOutlined,
  SwapOutlined,
};

/**
 * use Authorized check all menu item
 */
const menuDataRender = (menuList) => {
  return menuList.map((item) => {
    const localItem = {
      ...item,
      key: item.path,
      children: item.children ? menuDataRender(item.children) : undefined,
    };
    return localItem;
  });
};

export default connect(({ global, route, dispatch }) => ({
  global,
  route,
  dispatch,
}))((props) => {
  console.log('basic layout', props);
  const { dispatch } = props;
  const global = useModel('globalModel');
  console.log(global, useModel('count'));
  const { translateResult, translateVisible, translator } = props.global;
  console.log(translator, translateVisible, translateResult);
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

  const handleTransCancel = () => {
    dispatch({
      type: 'global/updateState',
      payload: {
        translateVisible: false,
      },
    });
  };
  const menuItems = router.routes
    .filter((item) => item.icon)
    .map((item) => {
      return {
        key: item.path,
        style: { padding: 0, textAlign: 'center' },
        label: (
          <Popover placement="right" content={item.name}>
            <Link to={item.path}>
              <Icon component={routeIcons[item.icon]} />
            </Link>
          </Popover>
        ),
      };
    });
  return (
    <Layout style={{ height: '100%' }}>
      <Sider
        theme="dark"
        width={58}
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
      <Layout style={{ marginLeft: 58 }}>
        <Layout.Header style={{ background: '#fefefe', height: 45 }}>
          <RightContent menu={true} theme="light" />
        </Layout.Header>
        <Layout.Content style={{ height: '100%', overflow: 'overflow' }}>
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
