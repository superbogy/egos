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
import { Select, Spin } from 'antd';
import {
  Ref,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import {
  Item,
  Menu as ContextMenu,
  Separator,
  useContextMenu,
  ItemParams,
} from 'egos-contexify';
import PasswordForm from './PasswordForm';
import { TagSchema } from '@/services/schema';
import { searchTags } from '../service';
import { FileSchema } from '@/services/file';

type CtxFn = (props: any) => void;

export interface CtxProps {
  currentItem: FileSchema | null;
  starred: number[];
  tags: TagSchema[];
  selected: number[];
  onDetail: CtxFn;
  onRename: CtxFn;
  onMove: CtxFn;
  onRemove: CtxFn;
  onDownload: CtxFn;
  onTagSelected: CtxFn;
  onSearchTag: CtxFn;
  onShare: CtxFn;
  onStar: CtxFn;
  onNewFolder?: CtxFn;
  onUpload?: CtxFn;
  onSort?: CtxFn;
  onCrypto: CtxFn;
  setCtx: (ctxObj: any) => void;
}

export const CtxMenu = forwardRef((props: CtxProps, ref: Ref<any>) => {
  const currentItem = props.currentItem;
  const selected = props.selected || [];
  const [pwd, setPwd] = useState<boolean>(false);
  const [tags, setTags] = useState<TagSchema[]>([]);
  const [fetchingTag, setFetchingTag] = useState<string>('');
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
  useEffect(() => {
    setTags(props.tags);
  }, [props.tags]);
  const getHighlightStyle = (key: any) => {
    const style: { color?: string } = {};
    if (!currentItem) {
      return style;
    }
    if (key in currentItem) {
      style.color = 'red';
    }
    const exists = props[key as keyof CtxProps] as number[];
    if (Array.isArray(exists) && exists?.includes(currentItem.id)) {
      style.color = 'green';
    }
    return style;
  };
  let tagTimer: any;

  const handleTagChange = (tags: string[]) => {
    if (!tagTimer) {
      clearTimeout(tagTimer);
    }
    tagTimer = setTimeout(() => {
      props.onTagSelected({ tags, id: currentItem?.id });
    }, 2500);
  };
  let tagSearchTimer: NodeJS.Timeout;
  const handleTagSearch = (name: string) => {
    console.log('ctx search tag', name, fetchingTag);
    if (fetchingTag) {
      return;
    }
    setFetchingTag(name);
    if (tagSearchTimer) {
      clearTimeout(tagSearchTimer);
    }
    tagSearchTimer = setTimeout(() => {
      searchTags(name).then((res) => {
        console.log('tags res', res);
        setTags(res);
        setFetchingTag('');
      });
    }, 400);
  };
  const cryptType = currentItem?.isEncrypt ? 'decrypt' : 'encrypt';
  const isMultiSelected = selected.length > 1;
  const onCtx =
    (cb: CtxFn, includeSelected?: boolean) =>
    (params: ItemParams<FileSchema, null>) => {
      if (includeSelected) {
        selected.push(params.props?.id as number);
        return cb([...selected]);
      }
      cb(params.props?.id as number);
    };
  return (
    <>
      <ContextMenu id="netdisk-item-ctx">
        <Item onClick={onCtx(props.onDetail, false)} disabled={isMultiSelected}>
          <div className="netdisk-ctx-text">
            <span>edit</span>
            <FundViewOutlined />
          </div>
        </Item>
        <Item onClick={onCtx(props.onRename, false)} disabled={isMultiSelected}>
          <div className="netdisk-ctx-text">
            <span>rename</span>
            <EditOutlined />
          </div>
        </Item>
        <Item onClick={onCtx(props.onMove, true)}>
          <div className="netdisk-ctx-text">
            <span>move</span>
            <ExportOutlined />
          </div>
        </Item>
        <Item onClick={onCtx(props.onRemove, true)}>
          <div className="netdisk-ctx-text">
            <span>delete</span>
            <DeleteOutlined />
          </div>
        </Item>
        <Item onClick={onCtx(props.onDownload, true)}>
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
                currentItem && currentItem.tags
                  ? currentItem.tags.map((t: any) => t.name)
                  : []
              }
              options={tags.map((tag) => {
                return {
                  key: tag.name,
                  label: (
                    <div key={tag.name}>
                      <span
                        className="netdisk-tag-color"
                        style={{ background: tag.name }}
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
              notFoundContent={fetchingTag ? <Spin size="small" /> : null}
              loading={!!fetchingTag}
            />
          </div>
        </Item>
        <Item onClick={onCtx(props.onStar, true)}>
          <div className="netdisk-ctx-text">
            <span>star</span>
            <StarFilled style={getHighlightStyle('starred')} />
          </div>
        </Item>
        <Item onClick={() => setPwd(true)} disabled={isMultiSelected}>
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
        <Item onClick={onCtx(props.onShare, false)} disabled={isMultiSelected}>
          <div className="netdisk-ctx-text">
            <span>share</span>
            <ShareAltOutlined style={getHighlightStyle('shared')} />
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
