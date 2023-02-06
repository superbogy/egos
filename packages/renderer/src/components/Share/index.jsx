import { dayMs } from '@/lib/helper';
import { CopyOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Tooltip,
} from 'antd';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import './index.less';

export default (props) => {
  const { file } = props;
  const [formData, setFormData] = useState({ expiry: 1, isExternal: false });
  const [qrLink, setQrLink] = useState(null);
  useEffect(() => {
    if (props.detail) {
      QRCode.toDataURL(props.detail.url).then((qrUrl) => {
        setQrLink(qrUrl);
      });
    }
  }, [props.detail]);
  const [form] = Form.useForm();
  useEffect(() => {
    if (!props.detail) {
      return () => {};
    }
    const share = props.detail;
    const days =
      (new Date(share.expiredAt).getTime() -
        new Date(share.createdAt).getTime()) /
      dayMs;
    const expiry = Math.floor(days) || 1;
    const data = { isExternal: share.isExternal, expiry, url: share.url };
    setFormData(data);
  }, [props.detail]);

  const handleCancel = () => {
    props.onCancel();
  };

  const updateFormData = (params) => {
    setFormData({ ...formData, ...params });
  };

  const handleOk = async () => {
    props.onShare({ ...formData, id: file.id });
  };
  const [isCopyUrl, setIsCopyUrl] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard.writeText(formData.url);
    setIsCopyUrl(true);
  };
  return (
    <>
      <Modal
        visible={props.visible}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={console.log} danger>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            Generate
          </Button>,
        ]}
      >
        <div className="share-box">
          {props.detail ? (
            <Card
              hoverable
              style={{ width: 240, marginRight: 12 }}
              cover={<img src={qrLink} />}
            >
              <Card.Meta title={file.filename} />
            </Card>
          ) : null}

          <div className="share-form">
            <Form layout="vertical" form={form}>
              <Form.Item label="Expiry" name="expiry">
                <Select
                  defaultValue={1}
                  onChange={(value) => updateFormData({ expiry: value })}
                >
                  <Select.Option value={1}> 1 day</Select.Option>
                  <Select.Option value={7}> 1 week</Select.Option>
                  <Select.Option value={30}> 1 month</Select.Option>
                  <Select.Option value={-1}> forever</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Type" name="isExternal">
                <Switch
                  className="switch-url-type"
                  checkedChildren="external"
                  unCheckedChildren="internal"
                  defaultChecked={formData.isExternal}
                  onChange={(value) => updateFormData({ isExternal: value })}
                />
              </Form.Item>
              {formData.url ? (
                <Form.Item label="Url" name="url">
                  <Input.Group compact>
                    <Input
                      value={formData.url}
                      style={{ width: 'calc(100% - 28px)' }}
                    />
                    <Tooltip title="copy to clipboard">
                      <Button
                        type={isCopyUrl ? 'dashed' : 'default'}
                        icon={<CopyOutlined />}
                        onClick={copyToClipboard}
                      />
                    </Tooltip>
                  </Input.Group>
                </Form.Item>
              ) : null}
            </Form>
          </div>
        </div>
      </Modal>
    </>
  );
};
