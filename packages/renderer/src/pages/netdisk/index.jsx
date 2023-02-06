import Header from '@/components/Header/Common';
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  FolderOpenOutlined,
  FundViewOutlined,
  PlusOutlined,
  QrcodeOutlined,
  ShareAltOutlined,
  SortAscendingOutlined,
  StarFilled,
  UploadOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Empty, Menu, Popover, Radio } from 'antd';
import { useLayoutEffect, useRef, useState } from 'react';
import Share from '@/components/Share';
import QRUploader from '@/components/Uploader/qrUpload';
import { history } from 'umi';
import {
  Item,
  Menu as ContextMenu,
  Separator,
  useContextMenu,
} from 'react-contexify';
import { connect, useIntl, useLocation } from 'umi';
import Card from './components/Card';
import Edit from './components/Edit';
import List from './components/List';
import Modal from './components/Modal';

import { DropBox } from '@/components/DnD';
import Provider from '@/components/DnD/Provider';
import Selecto from 'react-selecto';
import Remote from '@/lib/remote';

import { useCallback } from 'react';
import './index.less';

const sortMenus = [
  {
    name: '时间',
    key: 'id',
  },
  {
    name: '大小',
    key: 'size',
  },
  {
    name: '名称',
    key: 'filename',
  },
];
const ctxIds = ['disk-item-ctx', 'disk-container-ctx'];

const Index = (props) => {
  const { dispatch, disk } = props;
  const [liked, setLiked] = useState([]);
  const disableDrop = disk.entrance.map((item) => item.id);
  const location = useLocation();
  const intl = useIntl();
  const { meta, files, currentFolder, selected } = disk;
  const [editable, setEditable] = useState(null);
  const [currentItem, setCurrentItem] = useState(null);
  const { display = 'card' } = disk.query;
  const [modalVisible, setModalVisible] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const handleUpload = () => {
    remote.dialog
      .showOpenDialog({
        properties: ['openFile', 'openDirectory', 'multiSelections'],
        securityScopedBookmarks: true,
      })
      .then((res) => {
        if (res.canceled) {
          return;
        }
        dispatch({
          type: 'disk/upload',
          payload: { files: res.filePaths, parentId: currentFolder.id },
        });
      });
  };

  const contextHandlers = {
    open({ props }) {
      remote.ipcRenderer.send('openFile', props.file);
    },
    showInFolder({ props }) {
      if (!props.file) {
        return;
      }
      remote.ipcRenderer.send('showFile', props.file);
    },
    detail() {
      setEditable(true);
    },
    download({ props }) {
      dispatch({
        type: 'disk/download',
        payload: { ids: [props.id] },
      });
    },
    rename({ props }) {
      const elmId = 'file-item-id-' + props.id;
      const elm = document.getElementById(elmId);
      elm.focus();
    },
    like({ props }) {
      liked.push(props.id);
      setLiked(liked);
      dispatch({
        type: 'disk/likeIt',
        payload: { id: props.id },
      });
    },
    getLikedStyle() {
      const style = {};
      if (!currentItem) {
        return style;
      }
      if (currentItem.starred || liked.includes(currentItem.id)) {
        style.color = 'red';
      }
      return style;
    },
  };

  const headerProps = {
    showEditForm: false,
    display,
    orderBy: { id: -1 },
    sortMenus,
    onSearch: (keyword) => {
      dispatch({
        type: 'disk/query',
        payload: {
          keyword,
          parentId: currentFolder.id,
        },
      });
    },
    onSort: ({ key }) => {
      const sort = {
        [key]: 'asc',
      };
      if (disk.order[key]) {
        sort[key] = disk.order[key] === 'asc' ? 'desc' : 'asc';
      }
      dispatch({
        type: 'disk/setUserAction',
        payload: {
          order: sort,
        },
      });
      dispatch({
        type: 'disk/query',
        payload: {
          order: sort,
        },
      });
    },
    onToggleDisplay() {
      dispatch({
        type: 'disk/setUserAction',
        payload: {
          display: display === 'table' ? 'card' : 'table',
        },
      });
    },
  };
  const setSelect = (ids) => {
    const selectedIds = Array.isArray(ids) ? ids : [ids];
    dispatch({
      type: 'disk/updateState',
      payload: {
        selected: selectedIds,
      },
    });
  };
  const selectedRef = useRef(selected);

  useLayoutEffect(() => {
    selectedRef.current = selected;
  });
  const [showItemCtx, showContainerCtx] = ctxIds.map((menuId) => {
    /* eslint-disable */
    const { show } = useContextMenu({
      id: menuId,
    });
    return show;
  });
  const onContainerCtx = (ev) => {
    if (ev.defaultPrevented) {
      return;
    }
    ev.preventDefault();
    showContainerCtx(ev, {
      props: currentFolder,
    });
  };
  const gotoFolder = (id) => {
    if (Number.isNaN(Number(id))) {
      return;
    }
    history.go({
      pathname: location.pathname,
      query: { parentId: id },
    });
  };
  const handleDrop = useCallback(
    (item) => {
      const { src, dest } = item;
      let selectedIds = [...selectedRef.current];
      const sourceId = src.id;
      const targetId = dest.id;
      if (sourceId === targetId) {
        return false;
      }
      if (selectedIds.includes(targetId)) {
        return false;
      }
      selectedIds.push(sourceId);
      if (!selectedIds.includes(sourceId)) {
        selectedIds = [sourceId];
      }
      return dispatch({
        type: 'disk/move',
        payload: {
          target: dest,
          sourceIds: selectedIds.filter((value, index, self) => {
            return self.indexOf(value) === index;
          }),
        },
      });
    },
    [selectedRef, dispatch],
  );
  const cardProps = {
    data: files,
    selected,
    disable: disableDrop,
    pagination: {
      total: meta.total,
      pageSize: meta.pageSize || 25,
    },
    onSelect: setSelect,
    gotoFolder,
    onContext: (item) => (ev) => {
      if (ev.defaultPrevented) {
        return;
      }
      ev.preventDefault();
      setCurrentItem(item);
      showItemCtx(ev, {
        props: item,
      });
    },
    onMove: handleDrop,
    onSelectChange(activeItem, cmdKeyActive, shiftKeyActive) {
      let selectedIds = [];
      const activeId = currentItem ? currentItem.id : null;
      if (cmdKeyActive) {
        if (selected.includes(activeItem.id) && activeItem.id !== activeId) {
          selectedIds = selected.filter((i) => i !== activeItem.id);
        } else {
          selectedIds = [...selected, activeItem.id];
        }
      } else if (shiftKeyActive && activeItem.id !== activeId) {
        const current = files.findIndex((item) => item.id === activeItem.id);
        const prev = files.findIndex((item) => item.id === activeId);
        selectedIds = files.slice(current, prev).map((item) => item.id);
      } else {
        selectedIds = [activeItem.id];
      }
      setCurrentItem(activeItem);
      setSelect(selectedIds);
    },
    onDrag(item) {
      if (!selected.includes(item.id)) {
        setSelect([item.id]);
      }
    },
    onUpload({ files, parentId }) {
      handleNativeDrop({ files, parentId });
    },
    onRename({ id, name }) {
      dispatch({
        type: 'disk/rename',
        payload: {
          id,
          name,
        },
      });
    },
  };
  const tableProps = {
    ...cardProps,
  };
  const handleDel = (params) => {
    dispatch({
      type: 'disk/moveToTrash',
      payload: { ids: [params.props.id] },
    });
  };

  const onNewFolder = () => {
    setModalVisible(!modalVisible);
  };
  const refresh = () => {
    history.replace({
      ...location,
    });
  };
  const modalProps = {
    visible: modalVisible,
    onCancel: onNewFolder,
    currentFolder,
    onOk(values) {
      dispatch({
        type: 'disk/createFolder',
        payload: { ...values },
      }).then(() => {
        onNewFolder();
        refresh();
      });
    },
  };
  const getDisplayContent = () => {
    if (!files.length) {
      return <Empty description={null}></Empty>;
    }
    if (display === 'table') {
      return <List {...tableProps} />;
    }
    return <Card {...cardProps} />;
  };

  const gotoPath = (path) => {
    if (path === '/') {
      history.replace({
        pathname: location.pathname,
        query: {},
      });
    } else {
      dispatch({
        type: 'disk/gotoPath',
        payload: { path },
      }).then((res) => {
        if (!res) {
          return;
        }
        history.replace({
          pathname: location.pathname,
          query: {
            ...location.query,
            parentId: res.id,
          },
        });
      });
    }
  };
  const getBreadCrumb = () => {
    const pathItems = currentFolder.path.split('/').filter((item) => item);
    const breadNode = [];
    pathItems.reduce((prev, cur) => {
      const next = [prev, cur].join('/');
      breadNode.push(
        <Breadcrumb.Item onClick={() => gotoPath(next)} key={next}>
          <span className="peace">{cur}</span>
        </Breadcrumb.Item>,
      );
      return next;
    }, '');
    return breadNode;
  };
  const editProps = {
    visible: editable,
    currentItem,
    currentFolder,
    onClose() {
      setEditable(!editable);
    },
    availableFolders: disk.availableFolders,
    onSearch(name) {
      dispatch({
        type: 'disk/searchFolder',
        payload: { name },
      });
    },
    onSave(values) {
      dispatch({
        type: 'disk/save',
        payload: { ...values },
      });
    },
  };

  const handleNativeDrop = ({ files, parentId }) => {
    const paths = files.map((file) => file.path);
    dispatch({
      type: 'disk/upload',
      payload: { files: paths, parentId },
    });
  };

  const cancelSelected = (e) => {
    if (!e.defaultPrevented && !isDragging) {
      setSelect([]);
    } else {
      setDragging(false);
    }
  };
  const [shareItem, setShareItem] = useState({
    visible: false,
    file: {},
    shared: false,
  });
  const shareProps = {
    ...shareItem,
    detail: disk.shareDetail,
    onShare: (payload) => {
      dispatch({
        type: 'disk/share',
        payload,
      });
    },
    onCancel: () => {
      setShareItem({ ...shareItem, visible: !shareItem.visible });
    },
  };

  const handleShare = async (params) => {
    dispatch({
      type: 'disk/getShare',
      payload: { id: params.props.id },
    });
    shareItem.visible = true;
    shareItem.file = params.props;
    setShareItem(shareItem);
  };
  const [qrUpload, setQrUpload] = useState(false);
  const showQrUpload = () => {
    dispatch({
      type: 'disk/genUploadUrl',
      payload: {
        id: currentFolder.id,
        expiry: 86400 * 1000,
      },
    }).then((res) => {
      setQrUpload(!qrUpload);
    });
  };

  return (
    <>
      <div className="disk-box" onClick={cancelSelected}>
        <Header {...headerProps}>
          <Button type="text" icon={<PlusOutlined />} onClick={onNewFolder}>
            New
          </Button>
          <Button type="text" icon={<UploadOutlined />} onClick={handleUpload}>
            Upload
          </Button>
          <Popover content="">
            <Button
              type="text"
              icon={<QrcodeOutlined />}
              onClick={showQrUpload}
            ></Button>
          </Popover>
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
        <div className="crumb">
          <Breadcrumb>
            <Breadcrumb.Item onClick={() => gotoPath('/')}>
              <FolderOpenOutlined />
              <span className="peace">
                {intl.formatMessage({ id: `menu.disk.all` })}
              </span>
            </Breadcrumb.Item>
            {currentFolder.id ? getBreadCrumb() : null}
          </Breadcrumb>
        </div>
        <Provider>
          <div className="disk-layout">
            <div className="disk-sider">
              <Menu onClick={({ key }) => gotoFolder(key)}>
                {disk.entrance.map((item) => {
                  const dropProps = {
                    currentItem: item,
                    selected: [],
                    disable: disableDrop,
                    style: { flexGrow: 1 },
                    hoverStyle: {
                      paddingLeft: 4,
                      borderLeft: '4px solid #12b562',
                    },
                    onUpload: handleNativeDrop,
                  };
                  return (
                    <Menu.Item key={item.id}>
                      <DropBox {...dropProps}>{item.filename}</DropBox>
                    </Menu.Item>
                  );
                })}
              </Menu>
            </div>
            <div
              className="disk-main"
              onContextMenu={onContainerCtx}
              onDrop={(e) => {
                const { target } = e;
                const classList = [
                  ...target.classList,
                  ...target.parentElement.classList,
                ];
                if (!classList.includes('disk-main')) {
                  return;
                }
                handleNativeDrop({
                  files: Array.from(e.dataTransfer.files),
                  parentId: currentFolder.id,
                });
              }}
            >
              {getDisplayContent()}
            </div>
          </div>
        </Provider>
        <ContextMenu id="disk-item-ctx">
          <Item onClick={contextHandlers.detail}>
            <div className="disk-ctx-text">
              <span>show</span>
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
          <Item onClick={handleDel}>
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
          <Item onClick={handleShare}>
            <div className="disk-ctx-text">
              <span>share</span>
              <ShareAltOutlined />
            </div>
          </Item>
        </ContextMenu>
        <ContextMenu id="disk-container-ctx">
          <Item onClick={onNewFolder}>
            <div className="disk-ctx-text">
              <span>new folder</span>
              <PlusOutlined />
            </div>
          </Item>
          <Item onClick={console.log}>
            <div className="disk-ctx-text">
              <span>show</span>
              <FundViewOutlined />
            </div>
          </Item>
          <Item onClick={handleUpload}>
            <div className="disk-ctx-text">
              <span>upload</span>
              <UploadOutlined />
            </div>
          </Item>
          <Item onClick={console.log}>
            <div className="disk-ctx-text">
              <span>sort</span>
              <SortAscendingOutlined />
            </div>
          </Item>
          <Separator />
        </ContextMenu>
        <Modal {...modalProps} />
        <Edit {...editProps} />
        <Selecto
          container={document.main}
          dragContainer={'.ant-layout'}
          selectableTargets={['.drag-item']}
          selectByClick={false}
          selectFromInside={false}
          continueSelect={true}
          toggleContinueSelect={'shift'}
          keyContainer={window}
          hitRate={0}
          onSelect={(e) => {
            setDragging(true);
            const selectedIds = [];
            e.selected.map((item) => {
              const id = Number(item.dataset.id);
              if (selected.indexOf(id) === -1) {
                selectedIds.push(id);
              }
              return item;
            });
            setSelect([...selected, ...selectedIds]);
          }}
        />
      </div>
      <Share {...shareProps} />
      <QRUploader visible={qrUpload} url={disk.uploadUrl} />
    </>
  );
};
export default connect((s) => {
  const { disk, loading, router } = s;
  return {
    disk,
    loading,
    router,
  };
})(Index);
