import './index.less';

import {
  ArrowLeftOutlined,
  CheckOutlined,
  ShareAltOutlined,
  StarFilled,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Radio, Select, Space, Spin } from 'antd';
import classNames from 'classnames';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Item, Menu as ContextMenu, useContextMenu } from 'react-contexify';
import {
  AnyAction,
  Dispatch,
  connect,
  useLocation,
  useParams,
  history,
} from 'umi';

import { DropBox, ItemTypes, Sortable } from '@/components/DnD';
import Provider from '@/components/DnD/Provider';
import Header from '@/components/Header/Common';
import QRUploader from '@/components/Uploader/qrUpload';
import Viewer from '@/components/Viewer';
import ContentEditable from '@/components/Editable/Text';

import Uploader from '../components/Upload';
import { PhotoSchema } from '@/services/photo';
import { PhotoState } from './model';
import qs from 'query-string';
import { Selection, SelectionProps } from '@/components/Selection';
import { SelectionEvent } from '@viselect/react';
import { searchTags } from '@/pages/netdisk/service';
import { Tag } from '@/services/tag';

const { RangePicker } = DatePicker;

export interface PhotoProps {
  dispatch: Dispatch;
  photo: PhotoState;
}
const dataIndex = [
  { key: ['type'], alias: 'Type' },
  { key: ['filename'], alias: 'Filename' },
  { key: ['file', 'remote'], alias: 'Remote' },
  { key: ['file', 'size'], alias: 'Size' },
  { key: ['createdAt'], alias: 'create' },
];

const Index = (props: PhotoProps) => {
  const { dispatch, photo } = props;
  const { photos, meta, share } = photo;
  const { album, tags } = meta;
  console.log('photo tags', tags);
  const location = useLocation();
  const params = useParams();
  const MENU_ID = 'album-photos';
  const { show } = useContextMenu<any>({
    id: MENU_ID,
  });

  const [selected, setSelected] = useState<number[]>([]);
  const [currentItem, setCurrentItem] = useState<PhotoSchema | null>(null);
  const [isDragging, setDragging] = useState<boolean>(false);
  const [uploadVisible, setUploadVisible] = useState<boolean>(false);
  const toggleUpload = () => setUploadVisible(!uploadVisible);
  const [pendingTags, setPendingTags] = useState<any[]>([]);
  const [tagFetching, setTagFetching] = useState<boolean>();
  useEffect(() => {
    const query = qs.parse(location.search);
    console.log(location, params);
    dispatch({
      type: 'photo/query',
      payload: { ...query, albumId: params.id },
    });
  }, [location]);
  useEffect(() => {
    if (album.id) {
      dispatch({
        type: 'photo/getShare',
        payload: { albumId: album.id },
      });
    }
  }, [album.id]);
  const setActiveItem = (item: PhotoSchema) => {
    if (!selected.includes(item.id)) {
      setSelected((pre) => {
        if (pre.includes(item.id)) {
          return pre;
        }
        pre.push(item.id);
        return pre;
      });
    }
    setCurrentItem(item);
  };
  const handleContextMenu = (p: PhotoSchema) => (event: any) => {
    event.preventDefault();
    setActiveItem(p);
    show({
      event,
      props: p,
    });
  };
  const setAlbumCover = () => {
    dispatch({
      type: 'photo/setCover',
      payload: currentItem,
    });
  };

  const deletePhotos = () => {
    dispatch({
      type: 'photo/delete',
      payload: {
        ids: selected,
      },
    });
  };

  const handleItemClick = ({ event, prop }: any) => console.log(event, prop);
  const showModal = () => {
    dispatch({
      type: 'photo/toggleModal',
      payload: {
        visible: true,
      },
    });
  };

  const openExternal = () => {
    console.log(currentItem);
  };

  const getHeaderMenus = () => {
    if (!selected.length) {
      return null;
    }
    return (
      <Radio.Group>
        <Radio.Button value="large">download</Radio.Button>
        <Radio.Button value="default">tag</Radio.Button>
        <Radio.Button value="small" onClick={deletePhotos}>
          delete
        </Radio.Button>
      </Radio.Group>
    );
  };

  const onSelectChange = (activeItem: PhotoSchema, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentItem(activeItem);
    if (selected.includes(activeItem.id)) {
      return;
    }
    selected.push(activeItem.id);
    setSelected(selected);

    // const { metaKey, shiftKey } = e;
    // let selectedIds: number[] = [];
    // const allPhotos = Object.values(photos).reduce(
    //   (pre, acc) => pre.concat(acc),
    //   [],
    // );
    // const activeId = currentItem ? currentItem.id : null;
    // if (metaKey) {
    //   if (selected.includes(activeItem.id) && activeItem.id !== activeId) {
    //     selectedIds = selected.filter((i) => i !== activeItem.id);
    //   } else {
    //     selectedIds = [...selected, activeItem.id];
    //   }
    // } else if (shiftKey && activeItem.id !== activeId) {
    //   const current = allPhotos.findIndex(
    //     (item: PhotoSchema) => item.id === activeItem.id,
    //   );
    //   const prev = allPhotos.findIndex(
    //     (item: PhotoSchema) => item.id === activeId,
    //   );
    //   selectedIds = allPhotos
    //     .slice(current, prev)
    //     .map((item: PhotoSchema) => item.id);
    // } else if (!selected.includes(activeItem.id)) {
    //   selectedIds = [activeItem.id];
    // }
    // setSelected(selectedIds);
  };

  const handleFilter = (payload: any) => {
    dispatch({
      type: 'photo/query',
      payload: {
        ...payload,
        albumId: album.id,
      },
    });
  };

  const headerProps = {
    showEditForm: showModal,
    selectAll: (reverse: number[]) => {
      dispatch({
        type: 'photo/selectAll',
        payload: { all: reverse },
      });
    },
    selected,
    display: 'square',
    orderBy: { id: -1 },
    additionalMenus: getHeaderMenus(),
    onSearch: (keyword: string) => {
      handleFilter({ keyword });
    },
    filterItems: (
      <RangePicker
        onChange={([start, end]: any) =>
          handleFilter({ start: start.format(), end: end.format() })
        }
      />
    ),
  };
  const [imgVisible, setImgVisible] = useState(false);
  const previewImage = (p: PhotoSchema) => (e: any) => {
    e.preventDefault();
    setImgVisible(true);
    // let size = 0;
    // console.log('click file', p);
    // if (p.file) {
    //   size = humanFormat(p.file.size);
    // }

    setActiveItem(p);
  };
  const cancelSelected = (e: React.MouseEvent) => {
    if (!e.defaultPrevented && !isDragging) {
      setSelected([]);
    } else {
      setDragging(false);
    }
  };

  const uploadProps = {
    pending: [],
    showSearch: false,
    visible: uploadVisible,
    onCancel: toggleUpload,
    searchAlbums: [album],
    onSearch: ({ keyword }: { keyword: string }) => console.log(keyword),
    onUpload(payload: any) {
      dispatch({
        type: 'photo/upload',
        payload: { ...payload, albumId: meta.album.id },
      });
    },
    onFinish: () => {
      // if (uploadVisible) {
      //   toggleUpload();
      // }
      // dispatch({
      //   type: 'photo/query',
      //   payload: { albumId: album.id },
      // });
    },
  };
  const dropProps = {
    dropType: ItemTypes.CARD,
    selected: [],
    disable: [],
    dropStyle: {
      background: '#e2e1e194',
    },
    hoverStyle: {
      border: '1px dashed cyan',
      background: '#e2e1e194',
    },
    onMove: (dayCol: any, photo: PhotoSchema) => {
      console.log('onDropOnmOve>>>?', dayCol, photo);
      dispatch({
        type: 'photo/moveToDay',
        payload: {
          sourceId: photo.id,
          day: Number(dayCol.day),
        },
      });
    },
    onDrop: (payload: any) => {
      const { files, currentItem } = payload;
      dispatch({
        type: 'album/upload',
        payload: {
          files: files.map((file: any) => {
            return {
              uid: Date.now(),
              path: file.path || file.originFileObj.path,
              albumId: album.id,
              photoDate: new Date(Number(currentItem.day)).toISOString(),
            };
          }),
        },
      });
    },
    canDrop: (source: PhotoSchema, target: any) => {
      const d1 = new Date(source.photoDate).getTime();
      const d2 = new Date(Number(target.day)).getTime();
      return d1 !== d2;
    },
  };
  const goBack = () => {
    history.go(-1);
  };
  const handleMove = (source: any, target: any) => {
    if (!source.id || !target.id) {
      return;
    }
    if (source.id === target.id) {
      return;
    }
    dispatch({
      type: 'photo/move',
      payload: {
        sourceId: source.id,
        targetId: target.id,
      },
    });
  };
  const showQrUpload = () => {
    return dispatch<AnyAction>({
      type: 'photo/genUploadUrl',
      payload: {
        id: album.id,
        expiry: 86400 * 1000,
      },
    });
  };
  const download = () => {
    dispatch({
      type: 'photo/download',
      payload: { ids: selected },
    });
  };

  const extractIds = (els: Element[]): number[] =>
    els
      .map((v) => {
        return v.getAttribute('data-id');
      })
      .filter(Boolean)
      .map(Number);

  const selectProps: SelectionProps = {
    selectables: '.select-item',
    onBeforeDrag: ({ event }: SelectionEvent) => {
      const elm = event?.target as Element;
      if (elm.classList.contains('content-input')) {
        return false;
      }
      return true;
    },
    onStart: ({ event, selection }: SelectionEvent) => {
      const hasSelected = (event as any).path.find((p: any) => {
        if (p.classList?.contains('selected')) {
          return true;
        }
        return false;
      });
      console.log('0000 start?', event);
      if (!event?.ctrlKey && !event?.metaKey && !hasSelected) {
        selection.clearSelection();
        setSelected([]);
      }
      setDragging(true);
    },
    onMove: ({
      store: {
        changed: { added, removed },
      },
      event,
    }: SelectionEvent) => {
      if (event && (added.length || removed.length)) {
        setSelected((prev) => {
          const next = prev;
          extractIds(added).forEach((id) => {
            if (!next.includes(id)) {
              next.push(id);
            }
          });
          extractIds(removed).forEach((id) => {
            const idx = next.indexOf(id);
            if (idx === -1) {
              return;
            }
            next.splice(idx, 1);
          });
          console.log(next);
          return next;
        });
      }
    },
  };
  let tagSearchTimer: NodeJS.Timeout;
  const handleTagSearch = (name: string) => {
    console.log('ctx search tag', name, pendingTags);
    setTagFetching(true);
    if (tagSearchTimer) {
      clearTimeout(tagSearchTimer);
    }
    tagSearchTimer = setTimeout(() => {
      searchTags(name).then((res) => {
        console.log('tags res--->', res);
        setPendingTags(res);
        setTagFetching(false);
      });
    }, 800);
  };
  let tagTimer: NodeJS.Timeout;
  const handleTagChange = (tags: string[]) => {
    if (!tagTimer) {
      clearTimeout(tagTimer);
    }
    tagTimer = setTimeout(() => {
      Tag.setTags({ ids: selected, tags, type: 'photo' }).then(() => {
        dispatch({
          type: 'photo/query',
          payload: {},
        });
      });
    }, 2500);
  };

  return (
    <>
      <div className="main" onClick={cancelSelected}>
        <Header {...headerProps}>
          <span style={{ paddingLeft: 12, cursor: 'pointer' }} onClick={goBack}>
            <ArrowLeftOutlined />
          </span>
          <Button icon={<UploadOutlined />} onClick={toggleUpload} type="text">
            upload
          </Button>
          {/* <Popconfirm
            title="Do you want to allow upload by external url"
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          >
            <Button
              type="text"
              icon={<QrcodeOutlined />}
              // onClick={showQrUpload}
            ></Button>
          </Popconfirm> */}
          <QRUploader
            info={{ url: share?.url, album: album.name }}
            onCancel={() => console.log}
            expiredAt={1}
            genQrCode={showQrUpload}
          />
          <>{getHeaderMenus()}</>
        </Header>
        <div className="album-gallery" onClick={cancelSelected}>
          <Provider>
            <Selection {...selectProps}>
              {Object.entries(photos).map(([day, list]: [string, any[]]) => {
                return (
                  <DropBox
                    {...dropProps}
                    currentItem={{ day, crossDay: true, id: day }}
                    key={day}
                  >
                    <div className="gallery-day-box">
                      <div className="timeline" key={day}>
                        <div>{moment(Number(day)).format('YYYY-MM-DD')}</div>
                      </div>
                      <Space size={8} wrap={true}>
                        {list.map((p: any) => {
                          return (
                            <div className="img-box" key={p.id}>
                              <div className="img-opts">
                                <Button
                                  type="dashed"
                                  shape="circle"
                                  onClick={(e) => onSelectChange(p, e)}
                                  icon={<CheckOutlined />}
                                />
                              </div>
                              <Sortable
                                currentItem={p}
                                onMove={handleMove}
                                selected={selected}
                                disable={selected.length > 1 ? selected : []}
                                canDrop={() => selected.length <= 1}
                              >
                                <div
                                  className={classNames(
                                    'select-item',
                                    'img-wrapper',
                                    {
                                      selected: selected.includes(p.id),
                                    },
                                  )}
                                  data-id={p.id}
                                  onClick={() => setActiveItem(p)}
                                  onDoubleClick={previewImage(p)}
                                >
                                  {p.file.type === 'image' ? (
                                    <img
                                      alt={p.id}
                                      className="pic"
                                      src={`http://local-egos?fileId=${p.objectId}&type=image`}
                                      onContextMenu={handleContextMenu(p)}
                                    />
                                  ) : (
                                    <video
                                      className="media"
                                      onContextMenu={handleContextMenu(p)}
                                      controls={true}
                                    >
                                      <source
                                        src={`atom://local-egos?fileId=${p.objectId}&type=image#t=0.5`}
                                        type="video/mp4"
                                      />
                                    </video>
                                  )}
                                </div>
                              </Sortable>
                              <div className="photo-info">
                                <ContentEditable
                                  text={p.name}
                                  className="photo-name"
                                  onChange={(name: string) => {
                                    return dispatch({
                                      type: 'photo/update',
                                      payload: { id: p.id, name: name },
                                    });
                                  }}
                                />
                              </div>
                              <div className="photo-extra">
                                <StarFilled />
                                <ShareAltOutlined />
                              </div>
                            </div>
                          );
                        })}
                      </Space>
                    </div>
                  </DropBox>
                );
              })}
            </Selection>
          </Provider>
        </div>
      </div>
      <ContextMenu id={MENU_ID}>
        <Item onClick={setAlbumCover}>设为封面</Item>
        <Item onClick={openExternal}>打开</Item>
        <Item onClick={deletePhotos}>编辑</Item>
        <Item onClick={download}>下载</Item>
        <Item>
          <div
            style={{ width: '100%', border: '1px solid #999' }}
            onClick={(ev) => {
              ev.stopPropagation();
            }}
          >
            <Select
              mode="tags"
              allowClear={false}
              size="small"
              bordered={false}
              placeholder="choose tags"
              defaultValue={
                tags && currentItem
                  ? tags
                      .filter((item) => item.sourceId === currentItem.id)
                      .map((t: any) => t.name)
                  : []
              }
              options={tags.map((tag) => {
                return {
                  key: tag.name,
                  label: (
                    <div key={tag.name}>
                      <span
                        className="netdisk-tag-color"
                        style={{ background: tag.color }}
                      ></span>
                      <span className="netdisk-tag-text">{tag.name}</span>
                    </div>
                  ),
                  value: tag.name,
                };
              })}
              style={{ width: '80%' }}
              onSearch={(tagName: string) => handleTagSearch(tagName)}
              onChange={(tags: string[]) => {
                console.log('on select tags', tags);
                handleTagChange(tags);
              }}
              notFoundContent={tagFetching ? <Spin size="small" /> : null}
              loading={!!tagFetching}
            />
          </div>
        </Item>
        <Item onClick={handleItemClick}>分享</Item>
        <Item onClick={handleItemClick}>收藏</Item>
        <Item onClick={deletePhotos}>删除</Item>
      </ContextMenu>
      {imgVisible && (
        <Viewer
          type="image"
          currentItem={currentItem || {}}
          dataIndex={dataIndex}
          visible={imgVisible}
          onClose={() => setImgVisible(!imgVisible)}
          list={Object.values(photos).reduce((pre, cur) => {
            return pre.concat(cur);
          }, [])}
          controls={true}
        />
      )}
      <Uploader {...uploadProps} />
    </>
  );
};

export default connect(
  ({ photo, loading }: { photo: PhotoState; loading: boolean }) => ({
    photo: photo,
    loading,
  }),
)(Index);