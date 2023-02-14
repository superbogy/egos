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
import {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  FC,
  ReactNode,
} from 'react';
import Share from '@/components/Share';
import QRUploader from '@/components/Uploader/qrUpload';
import { Dispatch, history } from 'umi';
import {
  Item,
  Menu as ContextMenu,
  Separator,
  TriggerEvent,
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
import { Remote } from '@/lib/remote';

import { useCallback } from 'react';
import { DiskState } from './model';
import { FileSchema } from '@/services/file';
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
const ctxIds = ['netdisk-item-ctx', 'netdisk-container-ctx'];

interface NetDiskProps {
  dispatch: Dispatch;
  netdisk: DiskState;
}

const Index: FC<NetDiskProps> = (props: NetDiskProps) => {
  const { dispatch, netdisk } = props;
  const [liked, setLiked]: [number[], any] = useState([]);
  const disableDrop = netdisk.entrance.map((item) => item.id);
  const location = useLocation();
  const intl = useIntl();
  const { meta, files, currentFolder, selected } = netdisk;
  const [editable, setEditable] = useState(false);
  const [currentItem, setCurrentItem] = useState<FileSchema | null>(null);
  const { display = 'card' }: { display?: string } = netdisk.query;
  const [modalVisible, setModalVisible] = useState(false);
  const [isDragging, setDragging] = useState(false);
  useEffect(() => {
    // const res = await service.query({});
    dispatch({
      type: 'netdisk/init',
      payload: { location },
    });
    console.log('location.state', location.state);
  }, [location]);
  const handleUpload = () => {
    Remote.Electron.dialog
      .showOpenDialog({
        properties: ['openFile', 'openDirectory', 'multiSelections'],
        securityScopedBookmarks: true,
      })
      .then((res: { canceled: boolean; filePaths: string[] }) => {
        if (res.canceled) {
          return;
        }
        dispatch({
          type: 'netdisk/upload',
          payload: { files: res.filePaths, parentId: currentFolder.id },
        });
      });
  };

  const contextHandlers = {
    open({ props }: { props: { file: string } }) {
      Remote.Electron.ipcRenderer.send('openFile', props.file);
    },
    showInFolder({ props }: any) {
      if (!props.file) {
        return;
      }
      Remote.Electron.ipcRenderer.send('showFile', props.file);
    },
    detail() {
      setEditable(true);
    },
    download({ props }: any) {
      dispatch({
        type: 'netdisk/download',
        payload: { ids: [props.id] },
      });
    },
    rename({ props }: any) {
      const elmId = 'file-item-id-' + props.id;
      const elm = document.getElementById(elmId) as HTMLElement;
      elm.focus();
    },
    like({ props }: { props: FileSchema } | any) {
      liked.push(props.id as any);
      setLiked(liked);
      dispatch({
        type: 'netdisk/likeIt',
        payload: { id: props.id },
      });
    },
    getLikedStyle() {
      const style: { color?: string } = {};
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
    onSearch: (keyword: string) => {
      dispatch({
        type: 'netdisk/query',
        payload: {
          keyword,
          parentId: currentFolder.id,
        },
      });
    },
    onSort: ({ key }: { [key: string]: string }) => {
      const sort = {
        [key]: 'asc',
      };
      if (netdisk.order[key]) {
        sort[key] = netdisk.order[key] === 'asc' ? 'desc' : 'asc';
      }
      dispatch({
        type: 'netdisk/setUserAction',
        payload: {
          order: sort,
        },
      });
      dispatch({
        type: 'netdisk/query',
        payload: {
          order: sort,
        },
      });
    },
    onToggleDisplay() {
      dispatch({
        type: 'netdisk/setUserAction',
        payload: {
          display: display === 'table' ? 'card' : 'table',
        },
      });
    },
  };
  const setSelect = (ids: number[]) => {
    const selectedIds = Array.isArray(ids) ? ids : [ids];
    dispatch({
      type: 'netdisk/updateState',
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
  const onContainerCtx = (ev: TriggerEvent) => {
    if (ev.defaultPrevented) {
      return;
    }
    ev.preventDefault();
    showContainerCtx({
      event: ev,
      props: currentFolder,
    });
  };
  const gotoFolder = (id: number | string) => {
    if (Number.isNaN(Number(id))) {
      return;
    }
    history.push(location.pathname, { parentId: id });
  };
  const handleDrop = useCallback(
    (item: { src: FileSchema; dest: FileSchema }) => {
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
        type: 'netdisk/move',
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
    onContext: (item: FileSchema) => (ev: TriggerEvent) => {
      if (ev.defaultPrevented) {
        return;
      }
      ev.preventDefault();
      setCurrentItem(item);
      showItemCtx({
        event: ev,
        props: item,
      });
    },
    onMove: handleDrop,
    onSelectChange(
      activeItem: FileSchema,
      cmdKeyActive: any,
      shiftKeyActive: any,
    ) {
      let selectedIds = [];
      const activeId = currentItem ? currentItem.id : null;
      if (cmdKeyActive) {
        if (selected.includes(activeItem.id) && activeItem.id !== activeId) {
          selectedIds = selected.filter((i) => i !== activeItem.id);
        } else {
          selectedIds = [...selected, activeItem.id];
        }
      } else if (shiftKeyActive && activeItem.id !== activeId) {
        const current = files.findIndex(
          (item: any) => item.id === activeItem.id,
        );
        const prev = files.findIndex((item: any) => item.id === activeId);
        selectedIds = files.slice(current, prev).map((item: any) => item.id);
      } else {
        selectedIds = [activeItem.id];
      }
      setCurrentItem(activeItem);
      setSelect(selectedIds);
    },
    onDrag(item: FileSchema) {
      if (!selected.includes(item.id)) {
        setSelect([item.id]);
      }
    },
    onUpload({ files, parentId }: { files: any[]; parentId?: number }) {
      handleNativeDrop({ files, parentId });
    },
    onRename({ id, name }: { id: number; name: string }) {
      dispatch({
        type: 'netdisk/rename',
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
  const handleDel = (params: any) => {
    dispatch({
      type: 'netdisk/moveToTrash',
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
    async onOk(values: any) {
      const res = await dispatch({
        type: 'netdisk/createFolder',
        payload: { ...values },
      });
      setModalVisible(false);
      console.log(res);
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

  const gotoPath = (path: string) => {
    if (path === '/') {
      history.replace(location.pathname, {});
    } else {
      const q = dispatch({
        type: 'netdisk/gotoPath',
        payload: { path },
      });
      // .then((res) => {
      // if (!res) {
      //   return;
      // }
      // history.replace({
      //   pathname: location.pathname,
      //   query: {
      //     ...location.query,
      //     parentId: res.id,
      //   },
      // });
      // });
    }
  };
  const getBreadCrumb = () => {
    const pathItems = currentFolder.path.split('/').filter((item: any) => item);
    const breadNode: ReactNode[] = [];
    pathItems.reduce((prev: string, cur: string) => {
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
    availableFolders: netdisk.availableFolders,
    onSearch(name: string) {
      dispatch({
        type: 'netdisk/searchFolder',
        payload: { name },
      });
    },
    onSave(values: any) {
      dispatch({
        type: 'netdisk/save',
        payload: { ...values },
      });
    },
  };

  const handleNativeDrop = ({
    files,
    parentId,
  }: {
    files: File[];
    parentId?: number;
  }) => {
    const paths = files.map((file: any) => file.path);
    dispatch({
      type: 'netdisk/upload',
      payload: { files: paths, parentId },
    });
  };

  const cancelSelected = (e: any) => {
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
    detail: netdisk.shareDetail,
    onShare: (payload: any) => {
      dispatch({
        type: 'netdisk/share',
        payload,
      });
    },
    onCancel: () => {
      setShareItem({ ...shareItem, visible: !shareItem.visible });
    },
  };

  const handleShare = async (params: any) => {
    dispatch({
      type: 'netdisk/getShare',
      payload: { id: params.props.id },
    });
    shareItem.visible = true;
    shareItem.file = params.props;
    setShareItem(shareItem);
  };
  const [qrUpload, setQrUpload] = useState(false);
  const showQrUpload = () => {
    dispatch({
      type: 'netdisk/genUploadUrl',
      payload: {
        id: currentFolder.id,
        expiry: 86400 * 1000,
      },
    });
    setQrUpload(!qrUpload);
  };

  return (
    <>
      <div className="netdisk-box" onClick={cancelSelected}>
        <Header {...headerProps}>
          <Button type="text" icon={<PlusOutlined />} onClick={onNewFolder}>
            New
          </Button>
          <Button type="text" icon={<UploadOutlined />} onClick={handleUpload}>
            Upload
          </Button>
          <Popover content="" placement="bottom">
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
                {intl.formatMessage({ id: `menu.netdisk.all` })}
              </span>
            </Breadcrumb.Item>
            {currentFolder.id ? getBreadCrumb() : null}
          </Breadcrumb>
        </div>
        <Provider>
          <div className="netdisk-layout">
            <div className="netdisk-sider">
              <Menu onClick={({ key }) => gotoFolder(key)}>
                {netdisk.entrance.map((item) => {
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
              className="netdisk-main"
              onContextMenu={onContainerCtx}
              onDrop={(e) => {
                const { target } = e as any;
                const classList = [
                  ...target.classList,
                  ...target.parentElement.classList,
                ];
                if (!classList.includes('netdisk-main')) {
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
        <ContextMenu id="netdisk-item-ctx">
          <Item onClick={contextHandlers.detail}>
            <div className="netdisk-ctx-text">
              <span>show</span>
              <FundViewOutlined />
            </div>
          </Item>
          <Item onClick={contextHandlers.rename}>
            <div className="netdisk-ctx-text">
              <span>rename</span>
              <EditOutlined />
            </div>
          </Item>
          <Item onClick={console.log}>
            <div className="netdisk-ctx-text">
              <span>move</span>
              <ExportOutlined />
            </div>
          </Item>
          <Item onClick={handleDel}>
            <div className="netdisk-ctx-text">
              <span>delete</span>
              <DeleteOutlined />
            </div>
          </Item>
          <Item onClick={contextHandlers.download}>
            <div className="netdisk-ctx-text">
              <span>download</span>
              <DownloadOutlined />
            </div>
          </Item>
          <Separator />
          <Item onClick={contextHandlers.like}>
            <div className="netdisk-ctx-text">
              <span>star</span>
              <StarFilled style={contextHandlers.getLikedStyle()} />
            </div>
          </Item>
          <Item onClick={handleShare}>
            <div className="netdisk-ctx-text">
              <span>share</span>
              <ShareAltOutlined />
            </div>
          </Item>
        </ContextMenu>
        <ContextMenu id="netdisk-container-ctx">
          <Item onClick={onNewFolder}>
            <div className="netdisk-ctx-text">
              <span>new folder</span>
              <PlusOutlined />
            </div>
          </Item>
          <Item onClick={console.log}>
            <div className="netdisk-ctx-text">
              <span>show</span>
              <FundViewOutlined />
            </div>
          </Item>
          <Item onClick={handleUpload}>
            <div className="netdisk-ctx-text">
              <span>upload</span>
              <UploadOutlined />
            </div>
          </Item>
          <Item onClick={console.log}>
            <div className="netdisk-ctx-text">
              <span>sort</span>
              <SortAscendingOutlined />
            </div>
          </Item>
          <Separator />
        </ContextMenu>
        <Modal {...modalProps} />
        <Edit {...editProps} />
        <Selecto
          container={document.getElementsByTagName('main')[0]}
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
            const selectedIds: number[] = [];
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
      <QRUploader visible={qrUpload} url={netdisk.uploadUrl} />
    </>
  );
};
export default connect((s: any) => {
  const { netdisk, loading, router } = s;
  return {
    netdisk,
    loading,
    router,
  };
})(Index);
