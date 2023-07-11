import './card.less';

import {
  FolderFilled,
  LockOutlined,
  ShareAltOutlined,
  StarFilled,
} from '@ant-design/icons';
import { Badge, Empty, Pagination, Space } from 'antd';
import moment from 'moment';
import { useState } from 'react';

import { DragBox, DropBox } from '@/components/DnD';
import Viewer from '@/components/Viewer';
import Exhibit from '@/components/Viewer/exhibit';
import { FileSchema } from '@/services/file';
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
  { key: ['createdAt'], alias: 'Create' },
  { key: ['updatedAt'], alias: 'Update' },
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
  console.log('card props selected', props);
  const [preview, setPreview] = useState<FileSchema | null>(null);
  const handleImagePreview = (file: FileSchema) => {
    setPreview(file);
  };
  const getCard = (item: FileSchema) => {
    const dragProps = {
      currentItem: item,
      onMove,
      selected,
      onDrag: props.onDrag,
      style: { height: '100%' },
    };
    if (item.isFolder) {
      const dropProps = {
        selected,
        disable,
        currentItem: item,
        onUpload: props.onUpload,
        style: { height: '100%' },
      };
      return (
        <DropBox {...dropProps}>
          <DragBox {...dragProps}>
            <div>
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
    return (
      <DragBox {...dragProps}>
        <Exhibit
          file={item}
          boxClass="visible-file"
          className="card-img"
          onDoubleClick={() => handleImagePreview(item)}
          controls={false}
        />
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
    console.log('?????????---->>>', e);
    props.onSelectChange(item, e.metaKey, e.shiftKey);
  };
  const getCardItem = (item: FileSchema) => {
    return (
      <div key={item.id} className={classNames('card-box')} data-id={item.id}>
        <div
          className={classNames({
            selected: selected.includes(item.id),
            'drag-item': true,
            'card-icon': true,
          })}
          onClick={(e) => handleClick(item, e)}
          onContextMenu={props.onContext(item)}
          onDoubleClick={directToDetail(item)}
          data-id={item.id}
        >
          {getCard(item)}
        </div>
        <p
          className="card-name"
          contentEditable
          suppressContentEditableWarning={true}
          onBlur={handleRename(item)}
          id={'file-item-id-' + item.id}
          style={{ width: item.file?.type === 'video' ? 125 : 75 }}
        >
          {item.filename}
        </p>
        <div className="card-date">
          {moment(item.createdAt).format('YYYY-MM-DD')}
        </div>
        <div className="file-extra-info">
          <Space align="center" size={8}>
            {item.starred && (
              <span>
                <StarFilled />
              </span>
            )}
            {item.shared && (
              <span onClick={console.log}>
                <ShareAltOutlined />
              </span>
            )}
            {item.tags?.length ? (
              <span className="file-extra-tags">
                {item.tags.slice(0, 3).map((tag, idx) => (
                  <span key={tag.name} style={{ marginRight: idx ? -2 : 0 }}>
                    <Badge
                      color={tag.color}
                      style={{ fontSize: 12, width: 8, height: 8 }}
                    />
                  </span>
                ))}
              </span>
            ) : null}
          </Space>
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
