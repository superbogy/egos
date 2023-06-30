import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Breadcrumb, message, Upload } from 'antd';
import qs from 'query-string';
import React, { useEffect, useState } from 'react';
import type { Dispatch, Location } from 'umi';
import { connect } from 'umi';
import './index.less';
import type { UploaderState } from './model';

const { Dragger } = Upload;

type UploaderProps = {
  dispatch: Dispatch;
  uploader: UploaderState;
  children: [];
  location: Location;
};
const App: React.FC<UploaderProps> = (props: UploaderProps) => {
  const { uploader, dispatch, location } = props;
  const { source, meta } = uploader;
  const [routes, setRoutes] = useState<any[]>([]);
  useEffect(() => {
    if (!source) {
      return;
    }
    if (meta.type === 'album') {
      return setRoutes([
        {
          name: source.name,
          key: source.name,
        },
      ]);
    }
    if (source.path === '/') {
      return setRoutes([
        {
          name: '/',
          key: '/',
        },
      ]);
    }
    const r: any[] = [];
    source.path
      .split('/')
      .filter((item) => item)
      .reduce(
        (pre: string[], cur: string) => {
          pre.push(cur);
          r.push({
            name: cur || '/',
            key: pre.join('/'),
          });
          console.log('pre', pre);
          return pre;
        },
        [''],
      );
    setRoutes(r);
  }, [source, setRoutes, meta]);
  const uploadProps: UploadProps = {
    name: 'files',
    multiple: true,
    action: `/files/upload?${qs.stringify(location.query || {})}`,
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (status === 'done') {
        message.success(`${info.file.name} file uploaded successfully.`);
      } else if (status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };
  console.log('meta', meta, source, routes);
  return (
    <>
      <Breadcrumb>
        {routes.map((item) => (
          <Breadcrumb.Item key={item.key}>{item.name}</Breadcrumb.Item>
        ))}
      </Breadcrumb>
      <div className="eg-uploader-box">
        <Dragger {...uploadProps}>
          <div className="eg-upload-inner">
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for a single or bulk upload. Strictly prohibit from
              uploading company data or other band files
            </p>
          </div>
        </Dragger>
      </div>
    </>
  );
};

export default connect(
  ({
    uploader,
    dispatch,
  }: {
    uploader: UploaderState;
    dispatch: Dispatch;
  }) => ({
    dispatch,
    uploader,
  }),
)(App);
