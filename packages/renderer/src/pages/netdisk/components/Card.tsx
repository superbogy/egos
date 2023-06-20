import './card.less';

import {
  FileUnknownFilled,
  FolderFilled,
  LockFilled,
  LockOutlined,
} from '@ant-design/icons';
import { Badge, Empty, Pagination, Space } from 'antd';
import moment from 'moment';
import path from 'path';
import { useState } from 'react';
import { defaultStyles, FileIcon } from 'react-file-icon';

import { DragBox, DropBox } from '@/components/DnD';
import Viewer from '@/components/Viewer';
import Exhibit from '@/components/Viewer/exhibit';
import { FileSchema } from '@/services/file';
import { FileObjectSchema } from '@/services/file-object';
import { TriggerEvent } from 'react-contexify';
import classNames from 'classnames';

const dataIndex = [
  { key: ['file', 'bucket'], alias: 'Bucket' },
  { key: ['type'], alias: 'Type' },
  { key: ['filename'], alias: 'Filename' },
  { key: ['path'], alias: 'Path' },
  { key: ['url'], alias: 'URL' },
  { key: ['file', 'remote'], alias: 'Remote' },
  { key: ['file', 'size'], alias: 'Size' },
  { key: ['description'], alias: 'Description' },
  { key: ['createdAt'], alias: 'create' },
];

interface CardProps {
  pagination: any;
  onMove: ({ src, dest }: { src: FileSchema; dest: FileSchema }) => void;
  onDrag: (file: FileSchema) => void;
  onUpload: ({ files, parentId }: { files: any[]; parentId?: number }) => void;
  onRename: ({ id, name }: { id: number; name: string }) => void;
  gotoFolder: (id: number) => void;
  onContext: (file: FileSchema) => (ev: TriggerEvent) => void;
  onSelectChange: (file: FileSchema, metaKey: any, shiftKey: any) => void;
  selected: number[];
  disable: number[];
  data: FileSchema[];
}
export default (props: CardProps) => {
  const { pagination, onMove, selected, disable = [] } = props;
  const [preview, setPreview] = useState<FileSchema | null>(null);
  const handleImagePreview = (file: FileSchema) => {
    setPreview(file);
  };
  const getCard = (item: FileSchema) => {
    const file = item.file as FileObjectSchema;
    console.log(item);
    const dragProps = {
      currentItem: item,
      onMove,
      selected,
      onDrag: props.onDrag,
    };
    if (item.isFolder) {
      const dropProps = {
        selected,
        disable,
        currentItem: item,
        onUpload: props.onUpload,
      };
      return (
        <DropBox {...dropProps}>
          <DragBox {...dragProps}>
            <div className="drag-item" data-id={item.id}>
              <FolderFilled
                style={{ fontSize: 72, height: 72, color: 'cyan' }}
              />
              {item.isEncrypt ? (
                <div
                  style={{
                    marginTop: -72,
                    width: 72,
                    height: 72,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  <LockOutlined />
                </div>
              ) : null}
            </div>
          </DragBox>
        </DropBox>
      );
    }
    if (item.type) {
      return (
        <DragBox {...dragProps}>
          {item.isEncrypt ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignContent: 'center',
                height: 72,
                background: 'gray',
              }}
            >
              <span style={{ textAlign: 'center', fontSize: 16 }}>
                <LockFilled />
              </span>
              <span>文件已加密</span>
            </div>
          ) : (
            <Exhibit
              file={file}
              itemClass="card-img"
              className="drag-item"
              onDoubleClick={() => handleImagePreview(item)}
            />
          )}
        </DragBox>
      );
    }
    const ext = file.ext || path.extname(file.filename);
    return (
      <DragBox {...dragProps}>
        <div
          className="card-file-icon drag-item"
          data-id={item.id}
          onDoubleClick={() => handleImagePreview(item)}
        >
          {ext in defaultStyles ? (
            <FileIcon
              extension={ext}
              {...(defaultStyles as any)[ext]}
              fold={Boolean(item.isFolder)}
              style={{ fontSize: 75 }}
            />
          ) : (
            <FileUnknownFilled style={{ fontSize: 75, color: 'teal' }} />
          )}
        </div>
      </DragBox>
    );
  };
  const handleRename = (item: FileSchema) => {
    return (e: any) => {
      const newName = (e.target.innerText || '').trim();
      if (!newName) {
        e.target.innerText = item.filename;
      } else if (newName !== item.filename) {
        props.onRename({ id: item.id, name: newName });
      }
    };
  };
  const directToDetail = (item: FileSchema) => () => {
    if (item.isFolder) {
      props.gotoFolder(item.id);
    }
  };
  const handleClick = (item: FileSchema, e: any) => {
    e.preventDefault();
    props.onSelectChange(item, e.metaKey, e.shiftKey);
  };
  const getCardItem = (item: FileSchema) => {
    const tags = item.tags || [];
    return (
      <div key={item.id} className={classNames('card-box')}>
        <div
          className={classNames('card-icon', {
            selected: selected.includes(item.id),
          })}
          onClick={(e) => handleClick(item, e)}
          onContextMenu={props.onContext(item)}
          onDoubleClick={directToDetail(item)}
        >
          {getCard(item)}
        </div>
        <p
          className="card-name"
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={handleRename(item)}
          id={'file-item-id-' + item.id}
        >
          {tags.length ? (
            <Badge color={item.tags[0].color} text={item.filename} />
          ) : (
            item.filename
          )}
        </p>
        <div className="card-date">
          {moment(item.createdAt).format('YYYY-MM-DD')}
        </div>
      </div>
    );
  };
  return (
    <>
      {props.data.length ? (
        <>
          <Space align="center" wrap={true}>
            {props.data.map(getCardItem)}
          </Space>
          {pagination.total > pagination.pageSize ? (
            <div style={{ marginTop: 12 }}>
              <Pagination defaultCurrent={1} total={pagination.total} />
            </div>
          ) : null}
        </>
      ) : (
        <Empty />
      )}
      <Viewer
        dataIndex={dataIndex}
        visible={!!preview}
        list={props.data}
        currentItem={preview || {}}
        onClose={() => setPreview(null)}
        controls={true}
      />
    </>
  );
};
