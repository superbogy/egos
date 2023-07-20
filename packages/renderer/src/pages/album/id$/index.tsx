import './index.less';

import {
  ArrowLeftOutlined,
  CheckOutlined,
  ShareAltOutlined,
  StarFilled,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Radio, Space } from 'antd';
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
import ContentEditable from '@/components/Editable/Content';

import Uploader from '../components/Upload';
import { PhotoSchema } from '@/services/photo';
import { PhotoState } from './model';
import qs from 'query-string';
import { Selection, SelectionProps } from '@/components/Selection';
import { SelectionEvent } from '@viselect/react';

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
  const { album } = meta;
  const location = useLocation();
  const params = useParams();
  const MENU_ID = 'album-photos';
  const { show } = useContextMenu<any>({
    id: MENU_ID,
  });

  const [clickId, setClickId] = useState<number | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [currentItem, setCurrentItem] = useState<PhotoSchema | null>(null);
  const [isDragging, setDragging] = useState<boolean>(false);
  const [uploadVisible, setUploadVisible] = useState<boolean>(false);
  const toggleUpload = () => setUploadVisible(!uploadVisible);
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
  const handleContextMenu = (p: PhotoSchema) => (event: any) => {
    setClickId(p.id);
    event.preventDefault();
    show({
      event,
      props: {
        key: 'value',
      },
    });
  };
  const setAlbumCover = () => {
    dispatch({
      type: 'photo/setCover',
      payload: {
        id: clickId,
      },
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
  // const handleUpload = () => {
  //   remote.dialog
  //     .showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
  //     .then((res) => {
  //       if (res.canceled) {
  //         return;
  //       }
  //       dispatch({
  //         type: 'photo/upload',
  //         payload: { files: res.filePaths, albumId: meta.album.id },
  //       });
  //     });
  // };
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
    e.preventDefault();
    const { metaKey, shiftKey } = e;
    let selectedIds: number[] = [];
    const allPhotos = Object.values(photos).reduce(
      (pre, acc) => pre.concat(acc),
      [],
    );
    const activeId = currentItem ? currentItem.id : null;
    if (metaKey) {
      if (selected.includes(activeItem.id) && activeItem.id !== activeId) {
        selectedIds = selected.filter((i) => i !== activeItem.id);
      } else {
        selectedIds = [...selected, activeItem.id];
      }
    } else if (shiftKey && activeItem.id !== activeId) {
      const current = allPhotos.findIndex(
        (item: PhotoSchema) => item.id === activeItem.id,
      );
      const prev = allPhotos.findIndex(
        (item: PhotoSchema) => item.id === activeId,
      );
      selectedIds = allPhotos
        .slice(current, prev)
        .map((item: PhotoSchema) => item.id);
    } else if (!selected.includes(activeItem.id)) {
      selectedIds = [activeItem.id];
    }
    setCurrentItem(activeItem);
    setSelected(selectedIds);
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

    setCurrentItem(p);
  };
  const cancelSelected = (e: React.MouseEvent) => {
    if (!e.defaultPrevented && !isDragging) {
      setSelected([]);
    } else {
      setDragging(false);
    }
  };

  // const handleSelect = (e: any) => {
  //   setDragging(true);
  //   const selectedIds: number[] = [];
  //   e.selected.map((item: any) => {
  //     const id = Number(item.dataset.id);
  //     if (selected.indexOf(id) === -1) {
  //       selectedIds.push(id);
  //     }
  //     return item;
  //   });
  //   setSelected([...selected, ...selectedIds]);
  // };

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
    onUpload: (payload: any) => {
      console.log('on upload payload', payload);
      const { files, currentItem } = payload;
      if (!currentItem.day) {
        return;
      }
      dispatch({
        type: 'album/upload',
        payload: {
          files: files.map((file: any) => {
            return {
              uid: Date.now(),
              path: file.path || file.originFileObj.path,
              albumId: album.id,
              shootedAt: currentItem.day,
            };
          }),
        },
      });
    },
  };
  const goBack = () => {
    history.go(-1);
  };
  const handleMove = (source: any, target: any) => {
    if (target.crossDay) {
      console.log('cross day onmove', source, target);
      dispatch({
        type: 'photo/moveToDay',
        payload: {
          sourceId: source.id,
          day: Number(target.day),
        },
      });
      return;
    }
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
    console.log(album);
    return dispatch<AnyAction>({
      type: 'photo/genUploadUrl',
      payload: {
        id: album.id,
        expiry: 86400 * 1000,
      },
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
                              <Sortable
                                currentItem={p}
                                onMove={handleMove}
                                selected={selected}
                                disable={selected.length > 1 ? selected : []}
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
                                >
                                  {p.file.type === 'image' ? (
                                    <img
                                      alt={p.id}
                                      className="pic"
                                      src={`http://local-egos?fileId=${p.objectId}&type=image`}
                                      onDoubleClick={previewImage(p)}
                                      onContextMenu={handleContextMenu(p)}
                                    />
                                  ) : (
                                    <video
                                      className="media"
                                      onDoubleClick={previewImage(p)}
                                      onContextMenu={handleContextMenu(p)}
                                      controls={true}
                                    >
                                      <source
                                        src={`atom://local-egos?fileId=${p.objectId}&type=image#t=0.5`}
                                        type="video/mp4"
                                      />
                                    </video>
                                  )}

                                  <div className="img-opts">
                                    <Button
                                      type="dashed"
                                      shape="circle"
                                      onClick={(e) => onSelectChange(p, e)}
                                      icon={<CheckOutlined />}
                                    />
                                  </div>
                                </div>
                              </Sortable>
                              <div className="photo-info">
                                <ContentEditable
                                  text={p.name}
                                  className="photo-name"
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
        <Item onClick={handleItemClick}>下载</Item>
        <Item onClick={handleItemClick}>分享</Item>
        <Item onClick={handleItemClick}>删除</Item>
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
