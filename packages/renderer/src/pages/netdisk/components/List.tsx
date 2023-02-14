import React from 'react';
import { Table, Avatar } from 'antd';
import { FolderFilled } from '@ant-design/icons';
import { pick } from 'ramda';
import { DragBox, DropBox } from '@/components/DnD';
import { FileSchema } from '@/services/file';
import { FileObjectSchema } from '@/services/file-object';
type FileObj = FileSchema & { file: FileObjectSchema };
const renderFilename = (item: FileSchema) => {
  if (!item.isFolder) {
    return (
      <>
        <Avatar
          shape="square"
          style={{ color: '#f56a00', backgroundColor: '#fde3cf' }}
        >
          {item.file?.ext}
        </Avatar>
        <span
          style={{
            marginLeft: 10,
            lineHeight: '32px',
            verticalAlign: 'middle',
          }}
        >
          {item.filename}
        </span>
      </>
    );
  }

  return (
    <DragBox currentItem={item}>
      <FolderFilled style={{ fontSize: 28, color: 'cyan' }} />
      <span
        style={{ marginLeft: 10, lineHeight: '32px', verticalAlign: 'middle' }}
      >
        {item.filename}
      </span>
    </DragBox>
  );
};

const columns = [
  {
    title: '文件名',
    dataIndex: 'filename',
    key: 'filename',
    render: (text: string, currentItem: FileSchema) => {
      const DnD = currentItem.isFolder ? DropBox : DragBox;
      return (
        <DnD currentItem={currentItem} onUpload={console.log}>
          <div className="filename">{renderFilename(currentItem)}</div>
        </DnD>
      );
    },
    width: 365,
  },
  {
    title: '大小',
    dataIndex: 'size',
    key: 'size',
    render: (text: string, file: FileSchema) => {
      if (file.isFolder) {
        return '-';
      }
      return text;
    },
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '添加日期',
    dataIndex: 'createdAt',
    key: 'createdAt',
  },
  {
    title: '最近修改',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
  },
];

interface ListProps {
  selected: number[];
  onSelect: (keys: number[]) => void;
  data: FileSchema[];
  onContext: (f: FileObj) => void;
}
export default (props: ListProps) => {
  const rowSelection = {
    selectedRowKeys: props.selected,
    onChange: (selectedRowKeys: number[]) => {
      props.onSelect(selectedRowKeys);
    },
    // selections: [Table.SELECTION_ALL, Table.SELECTION_INVERT, Table.SELECTION_NONE],
  };
  const dataSource = props.data.map((item) => {
    const { file = {} } = item;
    return {
      ...pick(
        ['id', 'createdAt', 'updatedAt', 'filename', 'isFolder', 'type'],
        item,
      ),
      ...pick(['ext', 'size'], file),
    };
  });
  return (
    <>
      <Table
        rowSelection={rowSelection as any}
        columns={columns}
        dataSource={dataSource as any}
        onRow={(record: FileObj) => {
          return {
            onContextMenu: props.onContext(record),
          } as any;
        }}
      />
    </>
  );
};
