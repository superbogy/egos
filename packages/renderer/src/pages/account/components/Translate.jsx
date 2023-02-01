import { Form, Input, List, Skeleton, Space, Switch } from 'antd';

// import { getIcon } from '@/components/Translator';

export default () => {
  const dataSource = () => {
    return [
      {
        name: 'google',
        actions: [
          <Switch
            key="enable"
            checkedChildren="enable"
            unCheckedChildren="disable"
            defaultChecked
          />,
        ],
        description: 'Google machine translate',
      },
      {
        name: 'bing',
        actions: [
          <Switch
            key="enable"
            checkedChildren="enable"
            unCheckedChildren="disable"
            defaultChecked
          />,
        ],
        description: 'Bing dictionary',
      },
      {
        name: 'ciba',
        actions: [
          <Switch
            key="enable"
            checkedChildren="enable"
            unCheckedChildren="disable"
            defaultChecked
          />,
        ],
        description: '金山词霸翻译',
      },
      {
        name: 'youdao',
        actions: [
          <Switch
            key="enable"
            checkedChildren="enable"
            unCheckedChildren="disable"
            defaultChecked
          />,
        ],
        description: (
          <>
            <span>有道翻译</span>
            <span style={{ marginLeft: 40 }}>
              <Space>
                <Form.Item label="appId" rules={[{ required: true }]}>
                  <Input size="small" />
                </Form.Item>
                <Form.Item label="appKey" rules={[{ required: true }]}>
                  <Input size="small" />
                </Form.Item>
              </Space>
            </span>
          </>
        ),
      },
    ];
  };
  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={dataSource()}
        renderItem={(item) => {
          return (
            <List.Item actions={item.actions}>
              <Skeleton avatar title={false} loading={item.loading} active>
                <List.Item.Meta
                  avatar={getIcon(item.name)}
                  title={item.name}
                  description={item.description}
                />
              </Skeleton>
            </List.Item>
          );
        }}
      />
    </>
  );
};
