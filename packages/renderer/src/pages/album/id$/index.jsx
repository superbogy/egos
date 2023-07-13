import './index.less';

import {
  ArrowLeftOutlined,
  CheckOutlined,
  QrcodeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Popover, Radio, Space, Typography } from 'antd';
import classNames from 'classnames';
import { routerRedux } from 'dva/router';
import moment from 'moment';
import { useState } from 'react';
import { Item, Menu as ContextMenu, useContextMenu } from 'react-contexify';
import { connect } from 'umi';

import { DropBox, ItemTypes, Sortable } from '@/components/DnD';
import Provider from '@/components/DnD/Provider';
import Header from '@/components/HeaderFile';
import Selector from '@/components/Selector';
import QRUploader from '@/components/Uploader/qrUpload';
import Viewer from '@/components/Viewer';

import Uploader from '../component/Upload';

const remote = window.electronApi;
const { Title, Paragraph, Text, Link } = Typography;

const { RangePicker } = DatePicker;

const Index = (props) => {
  const { dispatch, photo } = props;
  const { photos, meta, buckets } = photo;
  const { album } = meta;
  const MENU_ID = 'album-photos';
  const { show } = useContextMenu({
    id: MENU_ID,
  });

  const [clickId, setClickId] = useState(null);
  const [selected, setSelected] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [isDragging, setDragging] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const toggleUpload = () => setUploadVisible(!uploadVisible);
  const handleContextMenu = (p) => (event) => {
    setClickId(p.id);
    event.preventDefault();
    show(event, {
      props: {
        key: 'value',
      },
    });
  };
  const setAlbumCover = () => {
    dispatch({
      type: 'albumInfo/setCover',
      payload: {
        id: clickId,
      },
    });
  };

  const deletePhotos = () => {
    dispatch({
      type: 'albumInfo/delete',
      payload: {
        ids: selected,
      },
    });
  };

  const handleItemClick = ({ event, prop }) => console.log(event, prop);
  // const handleUpload = () => {
  //   remote.dialog
  //     .showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] })
  //     .then((res) => {
  //       if (res.canceled) {
  //         return;
  //       }
  //       dispatch({
  //         type: 'albumInfo/upload',
  //         payload: { files: res.filePaths, albumId: meta.album.id },
  //       });
  //     });
  // };
  const showModal = () => {
    dispatch({
      type: 'albumInfo/toggleModal',
      payload: {
        visible: true,
      },
    });
  };

  const openExternal = () => {
    const current = photos.find((item) => item.id === clickId);
    remote.shell.openPath(current.local);
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

  const onSelectChange = (activeItem, e) => {
    e.preventDefault();
    const { metaKey, shiftKey } = e;
    let selectedIds = [];
    const activeId = currentItem ? currentItem.id : null;
    if (metaKey) {
      if (selected.includes(activeItem.id) && activeItem.id !== activeId) {
        selectedIds = selected.filter((i) => i !== activeItem.id);
      } else {
        selectedIds = [...selected, activeItem.id];
      }
    } else if (shiftKey && activeItem.id !== activeId) {
      const current = photos.findIndex((item) => item.id === activeItem.id);
      const prev = photos.findIndex((item) => item.id === activeId);
      selectedIds = photos.slice(current, prev).map((item) => item.id);
    } else if (!selected.includes(activeItem.id)) {
      selectedIds = [activeItem.id];
    }
    setCurrentItem(activeItem);
    setSelected(selectedIds);
  };

  const handleFilter = (payload) => {
    dispatch({
      type: 'albumInfo/query',
      payload: {
        ...payload,
        albumId: album.id,
      },
    });
  };

  const headerProps = {
    showEditForm: showModal,
    selectAll: (reverse) => {
      dispatch({
        type: 'albumInfo/selectAll',
        payload: { all: reverse },
      });
    },
    selected,
    display: 'square',
    orderBy: { id: -1 },
    additionalMenus: getHeaderMenus(),
    onSearch: (keyword) => {
      handleFilter({ keyword });
    },
    filterItems: (
      <RangePicker
        onChange={([start, end]) =>
          handleFilter({ start: start.format(), end: end.format() })
        }
      />
    ),
  };
  const [imgVisible, setImgVisible] = useState(false);
  const previewImage = (p) => (e) => {
    e.preventDefault();
    setImgVisible(true);
    // let size = 0;
    // console.log('click file', p);
    // if (p.file) {
    //   size = humanFormat(p.file.size);
    // }

    setCurrentItem(p);
  };
  const cancelSelected = (e) => {
    if (!e.defaultPrevented && !isDragging) {
      setSelected([]);
    } else {
      setDragging(false);
    }
  };

  const handleSelect = (e) => {
    setDragging(true);
    const selectedIds = [];
    e.selected.map((item) => {
      const id = Number(item.dataset.id);
      if (selected.indexOf(id) === -1) {
        selectedIds.push(id);
      }
      return item;
    });
    setSelected([...selected, ...selectedIds]);
  };

  const uploadProps = {
    buckets,
    pending: [],
    showSearch: false,
    visible: uploadVisible,
    onCancel: toggleUpload,
    searchAlbums: [album],
    onUpload(payload) {
      dispatch({
        type: 'album/upload',
        payload,
      });
    },
    onFinish: () => {
      if (uploadVisible) {
        toggleUpload();
      }
      dispatch({
        type: 'albumInfo/query',
        payload: { albumId: album.id },
      });
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
    onUpload: (payload) => {
      console.log('on upload payload', payload);
      const { files, currentItem } = payload;
      if (!currentItem.day) {
        return;
      }
      dispatch({
        type: 'album/upload',
        payload: {
          files: files.map((file) => {
            return {
              uid: Date.now(),
              path: file.path || file.originFileObj.path,
              albumId: album.id,
              shootAt: currentItem.day,
            };
          }),
        },
      });
    },
  };
  const goBack = () => {
    dispatch(routerRedux.goBack());
  };
  const handleMove = (source, target) => {
    if (target.crossDay) {
      console.log('cross day onmove', source, target);
      dispatch({
        type: 'albumInfo/moveToDay',
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
      type: 'albumInfo/move',
      payload: {
        sourceId: source.id,
        targetId: target.id,
      },
    });
  };
  const [qrUpload, setQrUpload] = useState(false);
  const showQrUpload = () => {
    console.log(album);
    dispatch({
      type: 'albumInfo/genUploadUrl',
      payload: {
        id: album.id,
        expiry: 86400 * 1000,
      },
    }).then((res) => {
      console.log(res);
      setQrUpload(!qrUpload);
    });
  };

  const dataIndex = [
    { key: ['file', 'bucket'], alias: 'Bucket' },
    { key: ['type'], alias: 'Type' },
    { key: ['filename'], alias: 'Filename' },
    { key: ['file', 'remote'], alias: 'Remote' },
    { key: ['file', 'size'], alias: 'Size' },
    { key: ['createdAt'], alias: 'create' },
  ];

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
          <Popover content="">
            <Button
              type="text"
              icon={<QrcodeOutlined />}
              onClick={showQrUpload}
            ></Button>
          </Popover>
          {getHeaderMenus()}
        </Header>
        <div className="album-gallery" onClick={cancelSelected}>
          <Provider>
            {Object.entries(photos).map(([day, list]) => {
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
                      {list.map((p) => {
                        return (
                          <Sortable
                            currentItem={p}
                            key={p.id}
                            onMove={handleMove}
                            onUpload={false}
                            selected={selected}
                            disable={selected.length > 1 ? selected : []}
                          >
                            <div className="img-box">
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
                                {p.type === 'image' ? (
                                  <img
                                    alt={p.id}
                                    className="pic"
                                    src={`http://local-egos${p.local}`}
                                    onClick={previewImage(p)}
                                    onContextMenu={handleContextMenu(p)}
                                  />
                                ) : (
                                  <video
                                    className="media"
                                    onClick={previewImage(p)}
                                    onContextMenu={handleContextMenu(p)}
                                    controls={true}
                                  >
                                    <source
                                      src={`http://local-egos${p.local}#t=0.5`}
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
                            </div>
                          </Sortable>
                        );
                      })}
                    </Space>
                  </div>
                </DropBox>
              );
            })}
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
      <Viewer
        currentItem={currentItem || {}}
        dataIndex={dataIndex}
        visible={imgVisible}
        onClose={() => setImgVisible(!imgVisible)}
        list={Object.values(photos).reduce((pre, cur) => {
          return pre.concat(cur);
        }, [])}
      />
      <Selector
        onSelect={handleSelect}
        container={document.main}
        dragContainer={'.album-gallery'}
        selectableTargets={['.select-item']}
        selectByClick={false}
        selectFromInside={false}
        continueSelect={true}
        toggleContinueSelect={'shift'}
        keyContainer={window}
        hitRate={0}
      />
      <Uploader {...uploadProps} />
      <QRUploader visible={qrUpload} url={photo.uploadUrl} />
    </>
  );
};

export default connect(({ albumInfo, loading }) => ({
  photo: albumInfo,
  loading,
}))(Index);
