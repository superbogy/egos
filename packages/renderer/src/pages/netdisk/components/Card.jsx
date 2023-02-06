import './card.less';

import { FileUnknownFilled, FolderFilled } from '@ant-design/icons';
import { Empty, Pagination, Space } from 'antd';
import moment from 'moment';
import path from 'path';
import { useState } from 'react';
import { defaultStyles, FileIcon } from 'react-file-icon';

import { DragBox, DropBox } from '@/components/DnD';
import Viewer from '@/components/Viewer';
import Exhibit from '@/components/Viewer/exhibit';

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

export default (props) => {
  const { pagination, onMove, selected, disable = [] } = props;
  const [preview, setPreview] = useState(null);
  const handleImagePreview = (file) => {
    setPreview(file);
  };
  const getCard = (item) => {
    const { file } = item;
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
        <DropBox {...dropProps} droppable={selected.includes(item.id)}>
          <DragBox {...dragProps}>
            <div className="drag-item" data-id={item.id}>
              <FolderFilled
                style={{ fontSize: 100, height: 108, color: 'cyan' }}
              />
            </div>
          </DragBox>
        </DropBox>
      );
    }
    if (item.type) {
      return (
        <DragBox {...dragProps}>
          {/* <img
            onDoubleClick={() => handleImagePreview(item)}
            className="drag-item"
            src={`http://local-egos${file.local}`}
            data-id={item.id} */}
          {/* /> */}
          <Exhibit
            file={file}
            className="drag-item"
            onDoubleClick={() => handleImagePreview(item)}
          />
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
          {defaultStyles[ext] ? (
            <FileIcon
              extension={ext}
              {...defaultStyles[ext]}
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
  const handleRename = (item) => {
    return (e) => {
      const newName = (e.target.innerText || '').trim();
      if (!newName) {
        e.target.innerText = item.filename;
      } else if (newName !== item.filename) {
        props.onRename({ id: item.id, name: newName });
      }
    };
  };
  const directToDetail = (item) => (e) => {
    if (item.isFolder) {
      props.gotoFolder(item.id);
    }
  };
  const handleClick = (item, e) => {
    e.preventDefault();
    props.onSelectChange(item, e.metaKey, e.shiftKey);
  };
  const getCardItem = (item) => {
    const iconClass = ['card-icon'];
    if (selected.includes(item.id)) {
      iconClass.push('selected');
    }
    return (
      <div key={item.id} className="card-box">
        <div
          className={iconClass.join(' ')}
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
          {item.filename}
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
