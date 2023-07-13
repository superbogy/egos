import DefaultImg from '@/assets/default.png';
import { Sortable } from '@/components/DnD';
import { getNowDayMs } from '@/lib/helper';
import classNames from 'classnames';
import moment from 'moment';
import { memo } from 'react';
import { NativeTypes } from 'react-dnd-html5-backend';
import { v4 as uuid } from 'uuid';
// import ContentEditor from './ContentEditor';
import { AlbumSchema } from '@/services/album';
import { Remote } from '@/lib/remote';

export const ItemTypes = {
  CARD: 'card',
};

interface BoxProps {
  selected: number[];
  currentItem: AlbumSchema;
  index?: number;
  onUpload: (...args: any[]) => void;
  onMove: (sourceId: number, targetId: number) => void;
  onContextMenu: (...args: any[]) => void;
  gotoDetail: (...args: any[]) => void;
  onRename: (id: number, name: string) => void;
  onSelectChange: (...args: any[]) => void;
}

export default memo((props: BoxProps) => {
  const { selected, currentItem, onUpload } = props;
  console.log('album box', props);
  const handleMove = (source: AlbumSchema, target: AlbumSchema) => {
    props.onMove(source.id, target.id);
  };
  const handleUpload = (payload: any) => {
    const { files, currentItem } = payload;
    if (!currentItem) {
      return;
    }
    const albumId = currentItem.id;
    onUpload({
      files: files.map((file: any) => {
        return {
          uid: uuid(),
          path: file.path || file.originFileObj.path,
          albumId,
          shootAt: new Date(getNowDayMs()).toISOString(),
        };
      }),
    });
  };
  const fileHost = Remote.Electron.vars.localFileHost;
  console.log('fffuck', fileHost);
  return (
    <>
      <Sortable
        dropType={NativeTypes.FILE}
        currentItem={currentItem}
        onMove={handleMove}
        onUpload={handleUpload}
        selected={selected}
        disable={selected.length > 1 ? selected : []}
      >
        <div
          onContextMenu={props.onContextMenu}
          className={classNames('album-wrapper', {
            'album-selected': selected.includes(currentItem.id),
          })}
        >
          <div
            className={classNames('select-item', 'album-cover')}
            data-id={currentItem.id}
            onDoubleClick={() => props.gotoDetail(currentItem.id)}
            onClick={(e) => {
              e.preventDefault();
              props.onSelectChange(e, currentItem);
            }}
          >
            <img
              className="album-cover-img"
              alt={currentItem.name}
              src={
                currentItem.coverId
                  ? `${fileHost}${currentItem.coverId}`
                  : DefaultImg
              }
              style={{ width: '100%' }}
            />
          </div>
          <div className="meta">
            <div className="filename">
              {/* <div
                id={currentItem.id}
                text={currentItem.name}
                onBlur={props.onRename}
              /> */}
              <p
                className="card-name"
                contentEditable
                suppressContentEditableWarning={true}
                onBlur={console.log}
                id={'file-item-id-' + currentItem.id}
              >
                {currentItem.name}
              </p>
            </div>
            <div className="created">
              {moment(currentItem.createdAt).format('YYYY-MM-DD')}
            </div>
          </div>
        </div>
      </Sortable>
    </>
  );
});
