import { Button, Form, Input, Popover, Select, Skeleton } from 'antd';

import { useEffect, useState } from 'react';

import qrCode from 'qrcode';
import './qr.less';
import { QrcodeOutlined } from '@ant-design/icons';

interface QRLoaderProps {
  info: Record<string, any>;
  expiredAt?: number;
  onCancel: () => void;
  genQrCode: () => void;
}
const QRUploader = (props: QRLoaderProps) => {
  const info = props.info || {};
  const [qrLink, setQrLink] = useState<string>('');
  const [form] = Form.useForm();
  useEffect(() => {
    if (info.url) {
      qrCode.toDataURL(info.url).then((dataUrl) => {
        setQrLink(dataUrl);
      });
    }
  }, [info.url]);
  const onConfirm = async () => {
    // const values = await form.getFieldsValue();
    // console.log(values);
    Promise.resolve(props.genQrCode());
  };
  const handleCancel = () => {
    props.onCancel();
  };

  return (
    <>
      <Popover
        placement="rightBottom"
        trigger="click"
        content={
          <div className="qr-uploader-box">
            <div className="uploader-qrcode">
              {qrLink ? (
                <img style={{ width: 304 }} src={qrLink} />
              ) : (
                <Skeleton.Image active={true} />
              )}
            </div>
            <Form labelCol={{ span: 4 }} wrapperCol={{ span: 16 }} form={form}>
              <Form.Item label="expiry" name="expiry" initialValue={1}>
                <Select>
                  <Select.Option value={1}>1 day</Select.Option>
                  <Select.Option value={7}>1 week</Select.Option>
                  <Select.Option value={30}>1 month</Select.Option>
                  <Select.Option value={-1}>forever</Select.Option>
                </Select>
              </Form.Item>
              {Object.entries(info).map(([key, value]) => (
                <Form.Item
                  label={key}
                  name={key}
                  key={key}
                  initialValue={value}
                >
                  <Input disabled={true} />
                </Form.Item>
              ))}
              <Form.Item wrapperCol={{ span: 14, offset: 4 }}>
                <Button key="update" onClick={onConfirm}>
                  update
                </Button>
                <span style={{ marginLeft: 20 }}>
                  <Button key="disable" danger onClick={handleCancel}>
                    disable
                  </Button>
                </span>
              </Form.Item>
            </Form>
          </div>
        }
      >
        <Button
          type="text"
          icon={<QrcodeOutlined />}
          // onClick={showQrUpload}
        ></Button>
      </Popover>
    </>
  );
};

export default QRUploader;
