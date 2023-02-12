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

const getSortIcon = (order: number) => {
  if (!order) {
    return null;
  }
  return order > 1 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
};

interface CommonHeaderProps {
  onSort?: (args: any) => void;
  onToggleDisplay?: () => void;
  onSearch: (value: string) => void;
  orderBy: { [key: string]: number };
  display?: string;
  sortMenus?: any;
  filterItems?: ReactNode;
  children?: ReactNode[];
}

export const enum SortItem {
  TIME = 'createdAt',
  SIZE = 'size',
  name = 'name',
}

export default (props: CommonHeaderProps) => {
  const { onSort, onToggleDisplay, orderBy, display, sortMenus = [] } = props;
  const menuItems = sortMenus.map(
    (item: { key: number; [key: string]: any }) => {
      return {
        key: item.key,
        label: (
          <span style={{ fontSize: 12 }}>
            {item.name}
            {getSortIcon(orderBy[item.key])}
          </span>
        ),
      };
    },
  );
  const menu = (
    <Menu
      onClick={onSort}
      defaultSelectedKeys={Object.keys(orderBy)}
      items={menuItems}
    ></Menu>
  );
  return (
    <>
      <div className="g-header-wrapper">
        <Row style={{ padding: 2 }}>
          <Col span={12}>
            <Space size={8}>{props.children}</Space>
          </Col>
          <Col span={12}>
            <Space size={8} style={{ float: 'right', paddingRight: 12 }}>
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
                <Dropdown overlay={menu} placement="bottom">
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
