import Header from '@/components/Header/Common';
import {
  FolderOpenOutlined,
  PlusOutlined,
  QrcodeOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Badge,
  Breadcrumb,
  Button,
  Divider,
  Empty,
  Input,
  Menu,
  Popconfirm,
} from 'antd';
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
import { TriggerEvent } from 'egos-contexify';
import { connect, useIntl, useLocation } from 'umi';
import Card from './components/Card';
import Edit from './components/Edit';
import List from './components/List';
import Modal from './components/Modal';

import { DropBox } from '@/components/DnD';
import Provider from '@/components/DnD/Provider';
import { Remote } from '@/lib/remote';
import { SelectionEvent } from '@viselect/react';

import { useCallback } from 'react';
import { DiskState } from './model';
import { FileSchema } from '@/services/file';
import './index.less';
import { registerUploadEvent } from './events';
import { CtxMenu, CtxProps } from './components/CtxMenu';
import { Selection, SelectionProps } from '@/components/Selection';

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

interface NetDiskProps {
  dispatch: Dispatch;
  netdisk: DiskState;
}

const Index: FC<NetDiskProps> = (props: NetDiskProps) => {
  const { dispatch, netdisk } = props;
  const [starred, setStarred]: [number[], any] = useState([]);
  const disableDrop = netdisk.entrance.map((item) => item.id);
  const location = useLocation();
  const intl = useIntl();
  const { meta, tags, files, currentFolder, selected } = netdisk;
  const [editable, setEditable] = useState(false);
  const [currentItem, setCurrentItem] = useState<FileSchema | null>(null);
  const { display = 'card' }: { display?: string } = netdisk.query;
  const [modalVisible, setModalVisible] = useState(false);
  const [isDragging, setDragging] = useState(false);
  const ctxRef = useRef<any>(null);
  useEffect(() => {
    dispatch({
      type: 'netdisk/init',
      payload: { location },
    });
  }, [location]);
  useEffect(() => {
    registerUploadEvent(dispatch);
  }, []);
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
    console.log('fffffuck ids', ids);
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
  const gotoFolder = (id: number | string) => {
    if (Number.isNaN(Number(id))) {
      return;
    }
    history.push(location.pathname, { parentId: id });
  };
  const handleDrop = useCallback(
    (item: { src: FileSchema; dest: FileSchema }) => {
      const { src, dest } = item;
      console.log('onDrop-->', item);
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
      ctxRef.current?.item.show({
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
  const handleDel = (ids: number[]) => {
    dispatch({
      type: 'netdisk/moveToTrash',
      payload: { ids },
    });
  };

  const onNewFolder = () => {
    setModalVisible(!modalVisible);
  };
  const modalProps = {
    visible: modalVisible,
    onCancel: onNewFolder,
    currentFolder,
    async onOk(values: any) {
      await Promise.resolve(
        dispatch({
          type: 'netdisk/createFolder',
          payload: { ...values },
        }),
      );
      setModalVisible(false);
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
      dispatch({
        type: 'netdisk/gotoPath',
        payload: { path },
      });
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
  const handleShare = async (id: number) => {
    dispatch({
      type: 'netdisk/getShare',
      payload: { id },
    });
    shareItem.visible = true;
    shareItem.file = currentItem as FileSchema;
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
  const contextHandlers = {
    move: console.log,
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
    download(ids: number[]) {
      dispatch({
        type: 'netdisk/download',
        payload: { ids },
      });
    },
    rename(id: number) {
      console.log('rename id', id);
      if (!id) {
        return;
      }
      const elmId = 'file-item-id-' + id;
      console.log('rename id>>', elmId);
      const elm = document.getElementById(elmId) as HTMLElement;
      console.log(elm);
      elm.focus();
    },
    star(ids: number[]) {
      setStarred((prev: number[]) => {
        ids.map((id) => prev.push(id));
        return prev;
      });
      dispatch({
        type: 'netdisk/star',
        payload: { ids },
      });
    },
    delete: (ids: number[]) => {
      handleDel(ids);
    },
    onCrypto: async (params: { password: string; type: string }) => {
      return dispatch({
        type: 'netdisk/crypto',
        payload: {
          id: currentItem?.id,
          ...params,
        },
      });
    },
    onSearchTags: async (name: string) => {
      dispatch({
        type: 'netdisk/searchTags',
        payload: { name },
      });
    },
  };

  const ctxProps: CtxProps = {
    currentItem: currentItem,
    starred,
    tags,
    selected,
    onDetail: contextHandlers.detail,
    onRemove: contextHandlers.delete,
    onRename: contextHandlers.rename,
    onDownload: contextHandlers.download,
    onMove: () => contextHandlers.move,
    onNewFolder: onNewFolder,
    onStar: contextHandlers.star,
    onSearchTag: contextHandlers.onSearchTags,
    onTagSelected: (params) => {
      console.log('tag selectd', params);
      dispatch({
        type: 'netdisk/updateTags',
        payload: params,
      });
    },
    onCrypto: contextHandlers.onCrypto,
    onShare: handleShare,
    onUpload: handleUpload,
    onSort: console.log,
    setCtx: ({ container, item }: any) => {
      console.log('?????? ', item, container);
    },
  };

  const extractIds = (els: Element[]): number[] =>
    els
      .map((v) => {
        return v.getAttribute('data-id');
      })
      .filter(Boolean)
      .map(Number);

  const selectProps: SelectionProps = {
    selectables: '.drag-item',
    onBeforeDrag: ({ event }: SelectionEvent) => {
      const elm = event?.target as Element;
      if (
        elm.classList.contains('card-name') ||
        elm.classList.contains('card-date')
      ) {
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
        setSelect([]);
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
        const next = selected;
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
        setSelect(next);
      }
    },
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
          <Popconfirm
            title="Allow upload by external url?"
            onConfirm={showQrUpload}
            onCancel={console.log}
            okText="Yes"
            cancelText="No"
            icon={<FolderOpenOutlined />}
          >
            <Button type="text" icon={<QrcodeOutlined />}></Button>
          </Popconfirm>
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
              <Divider orientation="left" plain>
                Quick
              </Divider>
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
                    onDrop: handleNativeDrop,
                  };
                  return (
                    <Menu.Item key={item.id}>
                      <DropBox {...dropProps}>{item.filename}</DropBox>
                    </Menu.Item>
                  );
                })}
              </Menu>
              <div>
                <Divider orientation="left" plain>
                  Tags
                </Divider>
                <div className="netdisk-tags">
                  <Input placeholder="search tag" bordered={false} />
                  {tags.map((tag) => {
                    return (
                      <span key={tag.name} className="file-tag-item">
                        <Badge color={tag.color} text={tag.name} />
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <div
              className="netdisk-main"
              onContextMenu={(ev) => {
                if (ev.defaultPrevented) {
                  return;
                }
                ev.preventDefault();
                ctxRef.current?.container.show({ event: ev });
              }}
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
              <Selection {...selectProps}>{getDisplayContent()}</Selection>
            </div>
          </div>
        </Provider>
        <CtxMenu {...ctxProps} ref={ctxRef} />
        <Modal {...modalProps} />
        <Edit {...editProps} />
      </div>
      <Share {...shareProps} />
      <QRUploader
        info={{ url: netdisk.uploadUrl }}
        onCancel={() => setQrUpload(false)}
        genQrCode={showQrUpload}
      />
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
