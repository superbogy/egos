import { dayMs } from '@/lib/helper';
import { FileSchema } from '@/services/file';
import { ShareSchema, UrlItem } from '@/services/share';
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
import { timeScale } from '@/utils';
import humanFormat from 'human-format';

interface ShareProps {
  visible: boolean;
  file: FileSchema | object;
  detail: ShareSchema | null;
  onCancel: () => void;
  onShare: (args: any) => void;
}
export default (props: ShareProps) => {
  const file = props.file as FileSchema;
  console.log('shuihuzhuang share props', props);
  const [formData, setFormData] = useState<any>({
    expiry: 1,
    isExternal: false,
  });
  const [qrLink, setQrLink] = useState<string[]>([]);
  useEffect(() => {
    const { internal } = props.detail?.url || {};
    if (internal) {
      console.log('share props', props.detail);
      Promise.all(
        internal.map((item: UrlItem) => {
          return QRCode.toDataURL(item.url as string);
        }),
      ).then((urls) => {
        setQrLink(urls);
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

  const updateFormData = (params: any) => {
    setFormData({ ...formData, ...params });
  };

  const handleOk = async () => {
    props.onShare({ ...formData, id: (file as FileSchema).id });
  };
  const [isCopyUrl, setIsCopyUrl] = useState(false);
  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setIsCopyUrl(true);
  };
  const ttl = props.detail
    ? new Date(props.detail.expiredAt).getTime() - Date.now()
    : 0;
  console.log('ffffformData', formData.url);
  return (
    <>
      <Modal
        open={props.visible}
        onCancel={handleCancel}
        width={640}
        footer={[
          <Button key="back" onClick={console.log} danger>
            Cancel
          </Button>,
          <Button key="submit" type="primary" onClick={handleOk}>
            {ttl ? 'Refresh' : 'Generate'}
          </Button>,
        ]}
      >
        <div className="share-box">
          {props.detail ? (
            <Card
              hoverable
              style={{ width: 280, marginRight: 12 }}
              cover={qrLink.map((link: string) => (
                <img src={link} key={link} />
              ))}
            >
              <Card.Meta
                title={file.filename}
                description={
                  <>
                    <span>TTL: </span>
                    <span>
                      {humanFormat(ttl, {
                        scale: timeScale,
                      })}
                    </span>
                  </>
                }
              />
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
              <Form.Item label="Disable external url" name="isExternal">
                <Switch
                  className="switch-url-type"
                  checkedChildren="false"
                  unCheckedChildren="true"
                  defaultChecked={formData.isExternal}
                  onChange={(value) => updateFormData({ isExternal: value })}
                />
              </Form.Item>
              {formData.url ? (
                <>
                  {formData.url.internal?.map((item: UrlItem) => (
                    <Form.Item
                      label={item.bucket}
                      name={item.bucket}
                      key={item.bucket}
                    >
                      <span
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                        }}
                      >
                        <Input value={item.url} style={{ marginRight: 2 }} />
                        <Tooltip title="copy to clipboard">
                          <Button
                            type={isCopyUrl ? 'dashed' : 'default'}
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(item.url)}
                          />
                        </Tooltip>
                      </span>
                    </Form.Item>
                  ))}
                  {formData.url.external.map((item: UrlItem) => (
                    <Form.Item
                      label={item.bucket}
                      name={item.bucket}
                      key={item.bucket}
                    >
                      <span
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                        }}
                      >
                        <Input value={item.url} style={{ marginRight: 2 }} />
                        <Tooltip title="copy to clipboard">
                          <Button
                            type={isCopyUrl ? 'dashed' : 'default'}
                            icon={<CopyOutlined />}
                            onClick={() => copyToClipboard(item.url)}
                          />
                        </Tooltip>
                      </span>
                    </Form.Item>
                  ))}
                </>
              ) : null}
            </Form>
          </div>
        </div>
      </Modal>
    </>
  );
};
