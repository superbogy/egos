import React from 'react';
import {
  Col,
  Row,
  Input,
  Button,
  Dropdown,
  Menu,
  Space,
  Checkbox,
  Radio,
} from 'antd';
import './header.less';
import {
  SortDescendingOutlined,
  AppstoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const sortMenus = [
  {
    name: '时间',
    key: 'id',
  },
  {
    name: '大小',
    key: 'size',
  },
  {
    name: '名称',
    key: 'filename',
  },
  {
    name: '自定义',
    key: 'custom',
  },
];
const getSortIcon = (order) => {
  return order > 1 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
};
export default (props) => {
  const {
    showEditForm,
    selected = [],
    onSort,
    selectAll,
    orderBy,
    additionalMenus,
  } = props;
  const menu = (
    <Menu onClick={console.log} defaultSelectedKeys={Object.keys(orderBy)}>
      {sortMenus.map((item) => {
        return (
          <Menu.Item key={item.key}>
            {item.name}
            {orderBy[item.key] ? getSortIcon(orderBy[item.key]) : null}
          </Menu.Item>
        );
      })}
    </Menu>
  );
  return (
    <>
      <div className="pre">
        <Row>
          <Col span={12}>
            <Space size={8}>{props.children || null}</Space>
          </Col>
          <Col span={12}>
            <Space size={8} style={{ float: 'right' }}>
              <Button
                type="primary"
                icon={<AppstoreOutlined />}
                onClick={onSort}
              ></Button>
              <Dropdown overlay={menu} placement="bottomCenter">
                <SortDescendingOutlined />
              </Dropdown>
            </Space>
          </Col>
        </Row>
      </div>
      <div className="select-all">
        <div>
          <Checkbox onChange={({ target }) => selectAll(target.checked)}>
            全选
          </Checkbox>
          {selected.length ? (
            <Button type="text" onClick={() => selectAll(false)}>
              取消
            </Button>
          ) : null}
        </div>
        <div>
          <Input.Search
            placeholder="搜索关键词"
            size="small"
            allowClear
            onSearch={(value) => {
              props.onSearch(value);
            }}
            style={{ maxWidth: 522, width: '100%' }}
          />
        </div>
      </div>
    </>
  );
};
