import './uploader.less';

import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { Col, DatePicker, Form, Modal, Row, Select, Upload } from 'antd';
import moment from 'moment';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { RcFile } from 'antd/lib/upload';

import { ipcEvent } from '@/lib/event';
import { getBase64 } from '@/lib/helper';
import { AlbumSchema } from '@/services/album';

interface UploadProps {
  visible: boolean;
  onCancel: () => void;
  searchAlbums: AlbumSchema[];
  buckets: any[];
  pending: any[];
  showSearch?: boolean;
  onSearch: ({ keyword }: { keyword: string }) => void;
  onFinish: () => void;
  onUpload: ({ files }: { files: any }) => void;
}
let processing = 0;
export default (props: UploadProps) => {
  const { visible, onCancel, searchAlbums = [], buckets = [] } = props;
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const fileRef = useRef<any[]>([]);
  const [preview, setPreview] = useState({
    visible: false,
    image: null,
    title: '',
  });
  const [form] = Form.useForm();
  const [pending, setPending] = useState<number[]>([]);
  useEffect(() => {
    setPending(props.pending);
  }, [props.pending]);
  useEffect(() => {
    fileRef.current = fileList;
  }, [fileList]);
  let timeout: any = null;
  let currentKeyword = '';
  const handlerSearch = (keyword: string) => {
    if (!props.showSearch) {
      return;
    }
    if (!keyword || currentKeyword === keyword) {
      return;
    }
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    currentKeyword = keyword;
    timeout = setTimeout(() => {
      props.onSearch({ keyword });
    }, 1000);
  };

  const options = searchAlbums.map((item) => (
    <Select.Option key={item.id} value={item.id}>
      {item.name}
    </Select.Option>
  ));
  const handleChange = (value: number) => {
    setSelectedAlbumId(value);
  };
  const handlePreview = async (file: any) => {
    /* eslint-disable */
    if (!file.url) {
      file.url = `file://${file.originFileObj.path}`;
    }
    setPreview({
      visible: true,
      image: file.url || file.thumbUrl,
      title: file.name || file.url.substring(file.url.lastIndexOf('/') + 1),
    });
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );
  const beforeUpload = async (file: RcFile, list: any[]) => {
    const { albumId, bucket, shootAt } = await form.validateFields();
    console.log('??? before upload', albumId, bucket, list);
    setFileList(
      list.map((file: any) => {
        file.albumId = albumId;
        file.bucket = bucket;
        file.shootAt = shootAt.toISOString();
        return file;
      }),
    );
    return false;
  };

  useEffect(() => {
    ipcEvent.register('photo-result', eventHandler);
  }, []);

  const uploadChange = ({ fileList: photoList }: any) => {
    const newList = photoList.map((item: any) => {
      console.log('upload change item', item, photoList);
      const { originFileObj } = item;
      if (!item.status) {
        item.status = 'initial';
        item.percent = 0;
      }
      if (originFileObj && !item.albumId) {
        item.albumId = originFileObj.albumId;
        item.bucket = originFileObj.bucket;
        item.shootAt = originFileObj.shootAt;
      }

      return item;
    });
    setFileList(newList);
  };

  const handleRemove = (file: any) => {
    setPending(pending.filter((item: any) => item.uid === file.uid));
  };
  const startUpload = () => {
    if (processing === 1) {
      return;
    }
    if (!fileList.length) {
      if (props.onFinish) {
        props.onFinish();
      }
      return;
    }
    if (!fileList.length) {
      return;
    }
    const files = fileList
      .filter((file: any) => file.status === 'initial')
      .map((item: any) => {
        console.log('start upload item', item);
        return {
          uid: item.uid,
          path: item.path || item.originFileObj.path,
          albumId: item.albumId,
          bucket: item.bucket,
          shootAt: item.shootAt,
        };
      });
    props.onUpload({ files });
  };
  const eventHandler = (_: any, { message: msg, payload }: any) => {
    console.log('eventHandler success', msg, payload, fileRef.current);
    let files = fileRef.current;
    const index = files.findIndex((item: any) => item.uid === payload.uid);
    if (index === -1) {
      processing = 0;
      if (!files.length) {
        props.onFinish();
      }
      return;
    }
    const current = files[index];
    if (msg === 'success') {
      current.status = 'done';
      processing = 0;
      current.percent = 100;
    } else if (msg === 'failed') {
      current.error = msg;
      processing = 0;
      current.status = 'error';
    } else {
      current.percent = 50;
      current.status = 'uploading';
      processing = 1;
    }
    console.log('fucking files', files);
    setFileList([...files]);
    setTimeout(() => {
      setFileList(fileList.filter((item) => item.status !== 'done'));
    }, 1000);
    startUpload();
  };
  const handleOk = async () => {
    startUpload();
  };
  const modalProps = {
    title: 'media upload',
    visible,
    onSave: console.log,
    onCancel,
    wrapClassName: 'upload-box',
  };
  const uploadProps = {
    action: '#',
    fileList: [...props.pending, ...fileList],
    multiple: true,
    listType: 'picture-card',
    onPreview: handlePreview,
    onRemove: handleRemove,
    onChange: uploadChange,
    beforeUpload: beforeUpload,
    previewFile: async (file: any) => {
      console.log('preview file --', file);
      if (!file.thumbUrl) {
        const dataUrl = await getBase64(file);
        return dataUrl;
      }
      return file.thumbUrl;
    },
    itemRender: (dom: ReactNode, file: any) => {
      const style: Record<string, string | number> = {
        height: '100%',
        width: '100%',
      };
      if (file.status === 'done') {
        style.border = '1px solid cyan';
      }
      return (
        <div style={style}>
          {dom}
          <div className="upload-done">
            {file.status === 'done' ? <CheckOutlined /> : null}
          </div>
        </div>
      );
    },
  };

  const selectProps: any = {
    onChange: handleChange,
    showSearch: props.showSearch,
    optionFilterProp: 'children',
    value: selectedAlbumId,
  };
  if (selectProps.showSearch) {
    selectProps.onSearch = handlerSearch;
  }
  return (
    <>
      <Modal {...modalProps} onOk={() => handleOk()}>
        <Form
          name="album-upload"
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 16 }}
          onFinish={console.log}
          onFinishFailed={console.log}
          autoComplete="off"
          form={form}
          initialValues={{
            albumId: searchAlbums.length ? searchAlbums[0].id : null,
            bucket: buckets.length ? buckets[0].name : '',
            shootAt: moment(new Date().toISOString(), 'YYYY-MM-DD'),
          }}
        >
          <Form.Item
            label="相册"
            name="albumId"
            rules={[{ required: true, message: 'choose album!' }]}
          >
            <Select {...selectProps}>{options}</Select>
          </Form.Item>
          <Form.Item
            label="bucket"
            name="bucket"
            rules={[{ required: false, message: 'choose bucket!' }]}
          >
            <Select>
              {buckets.map((bucket) => {
                return (
                  <Select.Option value={bucket.name} key={bucket.name}>
                    {bucket.name}
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>
          <Form.Item
            label="shoot Date"
            name="shootAt"
            rules={[{ required: false, message: 'choose shootAt!' }]}
          >
            <DatePicker onChange={console.log} />
          </Form.Item>
          <Row>
            <Col span={4}></Col>
            <Col span={18}>
              <Upload {...uploadProps}>
                {pending.length >= 15 ? null : uploadButton}
              </Upload>
            </Col>
          </Row>
        </Form>
        <Modal
          visible={preview.visible}
          title={preview.title}
          footer={null}
          onCancel={() => setPreview({ ...preview, visible: false })}
        >
          <img style={{ width: '100%' }} src={preview.image || ''} />
        </Modal>
      </Modal>
    </>
  );
};
