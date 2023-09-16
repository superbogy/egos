import './uploader.less';

import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import { Col, DatePicker, Form, Modal, Row, Select, Upload } from 'antd';
import moment from 'moment';
import { ReactNode, useEffect, useRef, useState } from 'react';

import { getBase64 } from '@/lib/helper';
import { AlbumSchema } from '@/services/album';
import type { RcFile, UploadProps } from 'antd/lib/upload';
import { Remote } from '@/lib/remote';

export interface UploaderProps {
  visible: boolean;
  onCancel: () => void;
  searchAlbums: AlbumSchema[];
  pending: any[];
  showSearch?: boolean;
  onSearch: (params: { keyword: string }) => void;
  onFinish: () => void;
  onUpload: (params: { files: any; albumId?: number }) => void;
}
let processing = 0;
export default (props: UploaderProps) => {
  const { visible, onCancel, searchAlbums = [] } = props;
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

  const options = searchAlbums.map((item) => {
    if (!Object.keys(item).length) {
      return null;
    }
    return (
      <Select.Option key={item.id} value={item.id}>
        {item.name}
      </Select.Option>
    );
  });
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
    const { albumId, photoDate } = await form.validateFields();
    setFileList(
      fileList.concat(list).map((f: any) => {
        f.albumId = albumId;
        f.photoDate = photoDate?.toISOString();
        return f;
      }),
    );
    return false;
  };

  useEffect(() => {
    Remote.Electron.ipcRenderer.removeListener('image:upload', console.log);
    Remote.Electron.ipcRenderer.on('image:upload', eventHandler);
  }, []);

  const uploadChange = ({ fileList: photoList, ...p }: any) => {
    const newList = photoList
      .filter((item: { status: string }) => item.status !== 'removed')
      .map((item: any) => {
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
    setFileList([...newList]);
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
        return {
          uid: item.uid,
          path: item.path || item.originFileObj.path,
          albumId: item.albumId,
          photoDate: item.photoDate,
        };
      });
    props.onUpload({ files });
  };
  const eventHandler = async (_: any, params: any) => {
    // action: 'upload';
    // file: '/Users/tomwei/Pictures/90f33047fe2c1beda220e615e1df2d20cb1275b8d6394-ludeX9_fw1200webp.webp';
    // message: 'progress';
    // percent: 0.9233413641038646;
    // size: 141954;
    // speed: 131.072;
    // status: 'uploading';
    // taskId: 24;
    // type: 'image';
    const { status, message, level, percent, speed, payload } = params;
    if (level === 'job') {
      return;
    }
    let files = fileRef.current;
    if (!files.length) {
      // props.onFinish();
    }
    const current = files.find((item: any) => item.uid === payload.uid);
    if (!current) {
      processing = 0;
      return;
    }
    setFileList((prev) =>
      prev.map((item) => {
        if (item.uid !== current.uid) {
          return item;
        }
        if (status === 'success') {
          current.status = 'done';
          processing = 0;
          current.percent = 100;
        } else if (status === 'error') {
          current.error = message;
          processing = 0;
          current.status = 'error';
        } else {
          current.percent = Math.floor(percent * 100);
          current.status = 'uploading';
          processing = 1;
        }
        return current;
      }),
    );
    setTimeout(() => {
      setFileList(fileList.filter((item) => item.status !== 'done'));
    }, 1000);
    if (processing == 0) {
      setTimeout(() => {
        startUpload();
      }, 1000);
    }
  };
  const handleOk = async () => {
    startUpload();
  };
  const modalProps = {
    title: 'media upload',
    open: visible,
    onSave: () => undefined,
    onCancel,
    wrapClassName: 'upload-box',
  };
  const uploadProps: UploadProps = {
    action: '#',
    fileList: [...props.pending, ...fileList],
    multiple: true,
    listType: 'picture-card',
    onPreview: handlePreview,
    onRemove: handleRemove,
    onChange: uploadChange,
    beforeUpload: beforeUpload,
    previewFile: async (file: any) => {
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
      console.log('item render', file.status);
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
    progress: {
      strokeColor: {
        '0%': '#108ee9',
        '100%': '#87d068',
      },
      strokeWidth: 3,
      format: (percent) => percent && `${parseFloat(percent.toFixed(2))}%`,
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
            photoDate: moment(new Date().toISOString(), 'YYYY-MM-DD'),
          }}
        >
          <Form.Item label="相册" name="albumId" rules={[{ required: true }]}>
            <Select {...selectProps}>{options}</Select>
          </Form.Item>
          <Form.Item
            label="photo Date"
            name="photoDate"
            rules={[{ required: false }]}
          >
            <DatePicker />
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
          open={preview.visible}
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
