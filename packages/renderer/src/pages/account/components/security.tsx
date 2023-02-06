import React from 'react';
import { List } from 'antd';

const SecurityView: React.FC = () => {
  const getData = () => [
    {
      title: '账户名',
      description: '当前用户名',
      actions: [<a key="Modify">修改</a>],
    },
    {
      title: '密码',
      description: `用于加密文件和数据库数据`,
      actions: [<a key="Modify">修改</a>],
    },
    {
      title: '备用设配',
      description: '未绑定设备，绑定后，可以访问远程已同步文件（只读）',
      actions: [<a key="backup">绑定</a>],
    },
  ];

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

export default SecurityView;
