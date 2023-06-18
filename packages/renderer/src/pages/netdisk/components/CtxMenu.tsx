import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  FundViewOutlined,
  LockOutlined,
  PlusOutlined,
  ShareAltOutlined,
  SortAscendingOutlined,
  StarFilled,
  UnlockFilled,
  UploadOutlined,
} from '@ant-design/icons';
import { Select } from 'antd';
import { Ref, forwardRef, useImperativeHandle, useState } from 'react';
import {
  Item,
  Menu as ContextMenu,
  Separator,
  useContextMenu,
} from 'react-contexify';
import PasswordForm from './PasswordForm';

type CtxFn = (props: any) => void;

export interface CtxProps {
  currentItem: any;
  starred: string[];
  onDetail?: CtxFn;
  onRename?: CtxFn;
  onMove?: CtxFn;
  onRemove?: CtxFn;
  onDownload?: CtxFn;
  onTagChange?: CtxFn;
  onSearchTag?: CtxFn;
  onShare?: CtxFn;
  onStar?: CtxFn;
  onNewFolder?: CtxFn;
  onUpload?: CtxFn;
  onSort?: CtxFn;
  onCrypto?: CtxFn;
  setCtx: (ctxObj: any) => void;
  tagList: any[];
}

export const CtxMenu = forwardRef((props: any, ref: Ref<any>) => {
  const currentItem = props.currentItem;
  const [pwd, setPwd] = useState<boolean>(false);
  const ctxItem = useContextMenu<any>({
    id: 'netdisk-item-ctx',
    props: currentItem,
  });
  const ctxContainer = useContextMenu<any>({
    id: 'netdisk-container-ctx',
    props: currentItem,
  });
  useImperativeHandle(ref, () => ({
    item: ctxItem,
    container: ctxContainer,
  }));
  const getStarredStyle = () => {
    const style: { color?: string } = {};
    if (!currentItem) {
      return style;
    }
    if (currentItem.starred || props.starred.includes(currentItem.id)) {
      style.color = 'red';
    }
    return style;
  };
  const cryptType = currentItem?.isEncrypt ? 'decrypt' : 'encrypt';
  return (
    <>
      <ContextMenu id="netdisk-item-ctx">
        <Item onClick={(ctx: any) => props.onDetail(ctx.props)}>
          <div className="netdisk-ctx-text">
            <span>show</span>
            <FundViewOutlined />
          </div>
        </Item>
        <Item onClick={({ props }) => props.onRename}>
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
        <Item onClick={props.onRemove}>
          <div className="netdisk-ctx-text">
            <span>delete</span>
            <DeleteOutlined />
          </div>
        </Item>
        <Item onClick={props.onDownload}>
          <div className="netdisk-ctx-text">
            <span>download</span>
            <DownloadOutlined />
          </div>
        </Item>
        <Separator />
        <Item>
          <div
            className="netdisk-ctx-text"
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
                currentItem?.tags
                  ? currentItem?.tags.map((t: any) => t.name)
                  : []
              }
              options={props.tagList}
              style={{ width: '80%' }}
              onSearch={(...args: any[]) => console.log('fffffuck', args)}
              onChange={props.onTagChange}
            />
          </div>
        </Item>
        <Item onClick={props.onStar}>
          <div className="netdisk-ctx-text">
            <span>star</span>
            <StarFilled style={getStarredStyle()} />
          </div>
        </Item>
        <Item onClick={() => setPwd(true)}>
          <div className="netdisk-ctx-text">
            {currentItem?.isEncrypt ? (
              <>
                <span>decrypt</span>
                <UnlockFilled />
              </>
            ) : (
              <>
                <span>encrypt</span>
                <LockOutlined />
              </>
            )}
          </div>
        </Item>
        <Item onClick={props.onShare}>
          <div className="netdisk-ctx-text">
            <span>share</span>
            <ShareAltOutlined />
          </div>
        </Item>
      </ContextMenu>
      <ContextMenu id="netdisk-container-ctx">
        <Item onClick={props.onNewFolder}>
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
        <Item onClick={props.onUpload}>
          <div className="netdisk-ctx-text">
            <span>upload</span>
            <UploadOutlined />
          </div>
        </Item>
        <Item onClick={props.onSort}>
          <div className="netdisk-ctx-text">
            <span>sort</span>
            <SortAscendingOutlined />
          </div>
        </Item>
      </ContextMenu>
      <PasswordForm
        visible={pwd}
        type={cryptType}
        onOk={props.onCrypto}
        onClose={() => setPwd(!pwd)}
      />
    </>
  );
});
