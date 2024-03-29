import './index.less';

import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  FundViewOutlined,
  PlusOutlined,
  ShareAltOutlined,
  StarFilled,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Pagination, Radio, Row, Space } from 'antd';
import { max } from 'ramda';
import { useEffect, useState } from 'react';
import {
  Item,
  Menu as ContextMenu,
  Separator,
  useContextMenu,
} from 'react-contexify';
import { connect, useLocation, history } from 'umi';

import Provider from '@/components/DnD/Provider';
import Header from '@/components/Header/Common';
import Share from '@/components/Share';

import AlbumBox from './components/AlbumBox';
import NewForm from './components/NewAlbum';
import UploadForm, { UploaderProps } from './components/Upload';
import { AlbumSchema } from '@/services/album';
import { AlbumState } from './model';

const Index = (props: any) => {
  const { dispatch, album } = props;
  const { albums, total, searchAlbums, buckets } = album;
  const [currentItem, setCurrentItem] = useState<AlbumSchema | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [isDragging, setDragging] = useState<boolean>(false);
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [uploadVisible, setUploadVisible] = useState<boolean>(false);
  const location = useLocation();
  useEffect(() => {
    dispatch({
      type: 'album/query',
    });
  }, [location]);

  const toggleModal = () => {
    setFormVisible(!formVisible);
  };

  const modalProps = {
    visible: formVisible,
    handleOk() {
      toggleModal();
    },
    handleCancel() {
      toggleModal();
    },
    onSave(data: any) {
      dispatch({
        type: 'album/save',
        payload: data,
      }).then(() => {
        toggleModal();
      });
    },
  };

  const gotoDetail = (albumId: number) => {
    console.log('goto detail', albumId);
    history.push(`/album/${albumId}`);
  };
  const onSelectChange = (
    { metaKey, shiftKey }: { metaKey?: any; shiftKey: any },
    activeItem: AlbumSchema,
  ) => {
    let selectedIds = [];
    const activeId = currentItem ? currentItem.id : null;
    if (metaKey) {
      if (selected.includes(activeItem.id) && activeItem.id !== activeId) {
        selectedIds = selected.filter((i) => i !== activeItem.id);
      } else {
        selectedIds = [...selected, activeItem.id];
      }
    } else if (shiftKey && activeItem.id !== activeId) {
      const current = albums.findIndex(
        (item: AlbumSchema) => item.id === activeItem.id,
      );
      const prev = albums.findIndex(
        (item: AlbumSchema) => item.id === activeId,
      );
      const greater = max(current, prev);
      const minor = greater === current ? prev : current;
      selectedIds = albums
        .slice(minor, greater + 1)
        .map((item: AlbumSchema) => item.id);
    } else {
      selectedIds = [activeItem.id];
    }
    setCurrentItem(activeItem);
    setSelected(selectedIds);
  };
  const headerProps = {
    showEditForm: toggleModal,
    selectAll: (reverse: boolean) => {
      if (reverse) {
        setSelected([]);
      } else {
        const ids = albums.map((item: AlbumSchema) => item.id);
        setSelected(ids);
      }
    },
    selected,
    display: 'card',
    orderBy: { id: -1 },
    onSearch: (keyword: string) => {
      dispatch({
        type: 'album/query',
        payload: {
          keyword,
        },
      });
    },
    onSort: ({ key }: { key: string }) => {
      const sort = {
        [key]: 'asc',
      };
      if (album.order[key]) {
        sort[key] = album.order[key] === 'asc' ? 'desc' : 'asc';
      }
      dispatch({
        type: 'album/query',
        payload: {
          order: sort,
        },
      });
      dispatch({
        type: 'album/setUserAction',
        payload: {
          order: sort,
        },
      });
    },
    onToggleDisplay: console.log,
  };
  const cancelSelected = (e: any) => {
    if (!e.defaultPrevented && !isDragging) {
      setSelected([]);
    } else {
      setDragging(false);
    }
  };
  const handleRename = (id: number, name: string) => {
    if (!id || !name) {
      return;
    }
    dispatch({
      type: 'album/rename',
      payload: {
        id,
        name,
      },
    });
  };
  const handleUpload = ({ files }: { files: any[] }) => {
    console.log('handle upload', files);
    dispatch({
      type: 'album/upload',
      payload: { files },
    });
  };
  const toggleUpload = () => setUploadVisible(!uploadVisible);
  const boxProps = {
    gotoDetail,
    selected,
    onMove: (sourceId: number, targetId: number) => {
      if (!sourceId || !targetId || sourceId === targetId) {
        return;
      }
      dispatch({
        type: 'album/move',
        payload: {
          sourceId,
          targetId,
        },
      });
    },
    onRename: handleRename,
    onSelectChange,
    onUpload: handleUpload,
    onFinish() {
      toggleUpload();
    },
  };
  const uploadProps: UploaderProps = {
    pending: album.pending,
    showSearch: true,
    visible: uploadVisible,
    onCancel: toggleUpload,
    searchAlbums,
    onSearch({ keyword }: { keyword: string }) {
      dispatch({
        type: 'album/search',
        payload: { keyword },
      });
    },
    onUpload: handleUpload,
    onFinish: () => {
      if (uploadVisible) {
        toggleUpload();
      }
      dispatch({
        type: 'album/query',
        payload: {},
      });
    },
  };
  const menuId = 'album-item-ctx';
  const { show } = useContextMenu<any>({
    id: menuId,
  });
  const onCtx = (p: any) => (ev: any) => {
    ev.preventDefault();
    show({ event: ev, props: p });
  };
  const [shareItem, setShareItem] = useState({
    visible: false,
    file: {},
    shared: false,
  });
  const shareProps = {
    ...shareItem,
    detail: album.shareDetail,
    onShare: (payload: any) => {
      dispatch({
        type: 'album/share',
        payload,
      });
    },
    onCancel: () => {
      setShareItem({ ...shareItem, visible: !shareItem.visible });
    },
  };
  const contextHandlers = {
    detail: console.log,
    rename: console.log,
    delete: console.log,
    download: console.log,
    like: console.log,
    getLikedStyle: () => {
      return {};
    },
    share: (params: any) => {
      dispatch({
        type: 'album/getShare',
        payload: { id: params.props.id },
      });
      shareItem.visible = true;
      shareItem.file = params.props;
      setShareItem(shareItem);
    },
  };
  return (
    <div className="album-container" onClick={cancelSelected}>
      <Header {...headerProps}>
        <Button icon={<UploadOutlined />} onClick={toggleUpload} type="text">
          upload
        </Button>
        <Button icon={<PlusOutlined />} onClick={toggleModal} type="text">
          new
        </Button>
        {selected.length ? (
          <Radio.Group>
            <Radio.Button value="large">download</Radio.Button>
            <Radio.Button value="large">share</Radio.Button>
            <Radio.Button value="default">tag</Radio.Button>
            <Radio.Button value="small" onClick={console.log}>
              delete
            </Radio.Button>
          </Radio.Group>
        ) : null}
      </Header>
      <div className="album-main">
        <Provider>
          <Space size={8} wrap={true}>
            {albums.map((item: AlbumSchema) => {
              return (
                <AlbumBox
                  {...boxProps}
                  onContextMenu={onCtx(item)}
                  currentItem={item}
                  selected={selected}
                  key={item.id}
                />
              );
            })}
          </Space>
        </Provider>
        {total ? (
          <Row>
            <Pagination
              showQuickJumper
              defaultCurrent={1}
              total={total}
              onChange={console.info}
            />
          </Row>
        ) : null}
      </div>
      <ContextMenu id={menuId}>
        <Item onClick={contextHandlers.detail}>
          <div className="disk-ctx-text">
            <span>view</span>
            <FundViewOutlined />
          </div>
        </Item>
        <Item onClick={contextHandlers.rename}>
          <div className="disk-ctx-text">
            <span>rename</span>
            <EditOutlined />
          </div>
        </Item>
        <Item onClick={console.log}>
          <div className="disk-ctx-text">
            <span>move</span>
            <ExportOutlined />
          </div>
        </Item>
        <Item onClick={contextHandlers.delete}>
          <div className="disk-ctx-text">
            <span>delete</span>
            <DeleteOutlined />
          </div>
        </Item>
        <Item onClick={contextHandlers.download}>
          <div className="disk-ctx-text">
            <span>download</span>
            <DownloadOutlined />
          </div>
        </Item>
        <Separator />
        <Item onClick={contextHandlers.like}>
          <div className="disk-ctx-text">
            <span>star</span>
            <StarFilled style={contextHandlers.getLikedStyle()} />
          </div>
        </Item>
        <Item onClick={contextHandlers.share}>
          <div className="disk-ctx-text">
            <span>share</span>
            <ShareAltOutlined />
          </div>
        </Item>
      </ContextMenu>
      <NewForm {...modalProps} />
      <UploadForm {...uploadProps} />
      <Share {...shareProps} />
    </div>
  );
};

export default connect(
  ({ album, loading }: { album: AlbumState; loading: boolean }) => ({
    album,
    loading,
  }),
)(Index);
