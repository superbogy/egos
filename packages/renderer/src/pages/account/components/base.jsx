import { Input, List, Select, Switch } from 'antd';

const BasicView = () => {
  const getData = () => {
    return [
      {
        title: '翻译',
        description: '翻译语言',
        actions: [
          <Select name="lang" value="auto" key="from" bordered={false}>
            <Select.Option value="auto">auto</Select.Option>
          </Select>,
          <Select name="lang" value="english" key="to" bordered={false}>
            <Select.Option value="english">English</Select.Option>
          </Select>,
        ],
      },
      {
        title: '主题',
        description: '主题',
        actions: [
          <span style={{ display: 'flex', flex: 1 }} key="theme">
            <Switch
              checkedChildren="dark"
              unCheckedChildren="light"
              defaultChecked
            />
          </span>,
        ],
      },
      {
        title: '分享',
        description: '分享有效期',
        actions: [
          <span style={{ display: 'flex' }} key="ttl">
            <Input
              placeholder="share ttl"
              defaultValue={3600}
              bordered={false}
            />
          </span>,
        ],
      },
      {
        title: '回收站',
        description: '回收站有效期',
        actions: [
          <span style={{ display: 'flex' }} key="trash-ttl">
            <Input
              placeholder="Trash ttl"
              defaultValue={3600}
              bordered={false}
            />
          </span>,
        ],
      },
    ];
  };

  const data = getData();
  return (
    <>
      <List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={(item) => (
          <List.Item actions={item.actions}>
            <List.Item.Meta title={item.title} description={item.description} />
          </List.Item>
        )}
      />
    </>
  );
};

export default BasicView;
