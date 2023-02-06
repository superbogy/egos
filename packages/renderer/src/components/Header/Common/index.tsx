import React, { ReactNode } from 'react';
import { Col, Row, Input, Button, Dropdown, Menu, Space } from 'antd';
import './header.less';
import {
  SortDescendingOutlined,
  AppstoreOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { Outlet } from 'umi';

const getSortIcon = (order: number) => {
  return order > 1 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
};

interface CommonHeaderProps {
  onSort?: () => void;
  onToggleDisplay: () => void;
  onSearch: (value: string) => void;
  orderBy: { [key: string]: number };
  display: string;
  sortMenus: any;
  filterItems: ReactNode;
}

export const enum SortItem {
  TIME = 'createdAt',
  SIZE = 'size',
  name = 'name',
}

export default (props: CommonHeaderProps) => {
  const { onSort, onToggleDisplay, orderBy, display, sortMenus = [] } = props;
  const menu = (
    <Menu onClick={onSort} defaultSelectedKeys={Object.keys(orderBy)}>
      {sortMenus.map((item: { key: number; [key: string]: any }) => {
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
      <div className="g-header-wrapper">
        <Row style={{ padding: 2 }}>
          <Col span={12}>
            <Space size={8}>
              <Outlet />
            </Space>
          </Col>
          <Col span={12}>
            <Space size={8} style={{ float: 'right' }}>
              {props.filterItems ? props.filterItems : null}
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
              {onToggleDisplay ? (
                <Button
                  type="text"
                  icon={
                    display === 'table' ? (
                      <TableOutlined />
                    ) : (
                      <AppstoreOutlined />
                    )
                  }
                  onClick={onToggleDisplay}
                ></Button>
              ) : null}

              {onSort ? (
                <Dropdown overlay={menu} placement="bottomCenter">
                  <SortDescendingOutlined />
                </Dropdown>
              ) : null}
            </Space>
          </Col>
        </Row>
      </div>
    </>
  );
};
