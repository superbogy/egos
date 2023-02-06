import { Avatar, Divider, List, Skeleton, Space } from 'antd';
import classNames from 'classnames';
import { Fragment, ReactNode, useState } from 'react';
import './binding.less';
import BindingForm from './BindingForm';

interface StoragePros {
  drivers: any;
  buckets: any[];
  onBucketChange: (payload: any) => void;
}

interface MenuDataItem {
  title: string;
  description: string;
  loading: false;
  actions: ReactNode[] | string;
  avatar: string;
}

const BindingView = (props: StoragePros) => {
  const { drivers, buckets } = props;
  const [currentDriver, setCurrentDriver] = useState('');
  const [activeBucket, setActiveBucket] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const bindStorage = (type: string) => {
    setCurrentDriver(type);
    setModalVisible(true);
    setActiveBucket({});
  };
  const getDriverBuckets = (driver: any) => {
    return buckets.filter((item) => item.driver === driver);
  };
  const handleOk = async (res: any) => {
    props.onBucketChange(res);
  };
  const onEdit = (bucket: any) => {
    setCurrentDriver(bucket.driver);
    setActiveBucket(bucket);
    setModalVisible(true);
  };
  const getData = (): MenuDataItem[] => {
    return Object.entries(drivers).map(([driverName]) => {
      const getDescription = () => {
        const bindings = getDriverBuckets(driverName);
        if (!bindings.length) {
          return `当前未绑定${driverName}`;
        }

        return (
          <Space split={<Divider type="vertical" />}>
            {bindings.map((bind) => {
              return (
                <span
                  className={classNames('account-binding-edit', {
                    'account-binding-active': bind.status === 'active',
                    'account-binding-enable': bind.status === 'enable',
                  })}
                  key={bind.name}
                  onClick={() => onEdit(bind)}
                >
                  {bind.name}
                </span>
              );
            })}
          </Space>
        );
      };
      return {
        title: driverName,
        description: getDescription(),
        loading: false,
        actions: [
          <span
            key={driverName}
            className="account-binding-action"
            onClick={() => bindStorage(driverName)}
          >
            绑定
          </span>,
        ],
        avatar: driverName,
      } as MenuDataItem;
    });
  };

  const formProps = {
    buckets,
    handleOk,
    name: currentDriver,
    driver: drivers[currentDriver],
    bucket: activeBucket,
    visible: modalVisible,
    onCancel: () => setModalVisible(!modalVisible),
    drivers: Object.keys(drivers),
  };

  return (
    <Fragment>
      <List
        itemLayout="horizontal"
        dataSource={getData()}
        renderItem={(item: MenuDataItem) => {
          return (
            <List.Item actions={item.actions as ReactNode[]}>
              <Skeleton avatar title={false} loading={item.loading} active>
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size={40}
                      style={{ color: '#f56a00', background: '#fde3cf' }}
                    >
                      {item.avatar}
                    </Avatar>
                  }
                  title={item.title}
                  description={item.description}
                />
              </Skeleton>
            </List.Item>
          );
        }}
      />
      <BindingForm {...formProps} />
    </Fragment>
  );
};

export default BindingView;
