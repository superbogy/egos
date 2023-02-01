import { Avatar, Divider, List, Skeleton, Space } from 'antd';
import classNames from 'classnames';
import { Fragment, useState } from 'react';
import './binding.less';
import BindingForm from './BindingForm';

const BindingView = (props) => {
  const { drivers, buckets } = props;
  const [currentDriver, setCurrentDriver] = useState('');
  const [activeBucket, setActiveBucket] = useState({});
  const onEdit = (bucket) => {
    setCurrentDriver(bucket.driver);
    setActiveBucket(bucket);
    setModalVisible(true);
  };
  const getData = () => {
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
      };
    });
  };
  const [modalVisible, setModalVisible] = useState(false);

  const getDriverBuckets = (driver) => {
    return buckets.filter((item) => item.driver === driver);
  };
  const bindStorage = (type) => {
    setCurrentDriver(type);
    setModalVisible(true);
    setActiveBucket({});
  };

  const handleOk = async (res) => {
    props.onBucketChange(res);
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
        renderItem={(item) => {
          return (
            <List.Item actions={item.actions}>
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
