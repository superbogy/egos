import { Divider, Form, Input, Modal, Select, Switch } from 'antd';
import { assocPath, lens, props as Rprops, set } from 'ramda';
import { useEffect } from 'react';

export interface BindProps {
  driver: Record<string, any>;
  name: string;
  bucket: any;
  buckets: any[];
  visible: boolean;
  handleOk: (payload: any) => void;
  onCancel: (payload: any) => void;
}
const BindingForm: React.FC<BindProps> = (props: BindProps) => {
  const { driver, name, bucket, buckets } = props;
  console.log('dddriver', driver);
  const [form] = Form.useForm();
  const handleOk = async () => {
    const res = await form.validateFields();
    let payload = {};
    Object.entries(res).forEach(([key, val]: [string, any]) => {
      const p = key.split('.');
      payload = set(lens(Rprops(p), assocPath(p)), val, payload);
    });

    props.handleOk(payload);
  };
  useEffect(() => {
    form.setFieldsValue({ ...bucket, driver: props.name });
  }, [props.name, bucket, form]);
  console.log('bucket info bucket', bucket);
  if (!driver) {
    return null;
  }
  return (
    <Modal
      title={name}
      open={props.visible}
      onOk={handleOk}
      onCancel={props.onCancel}
    >
      <Form
        form={form}
        name="binding-form"
        labelCol={{ span: 6 }}
        wrapperCol={{ span: 14 }}
        initialValues={{ ...bucket, driver: props.name }}
        onValuesChange={console.info}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'bucket name is required' }]}
        >
          <Input placeholder="bucket name" />
        </Form.Item>
        <Form.Item
          name="driver"
          label="Driver"
          rules={[{ required: true, message: 'bucket name is required' }]}
        >
          <Input placeholder="driver name" value={props.name} disabled />
        </Form.Item>
        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true, message: 'Type is required' }]}
        >
          <Select placeholder="Select type">
            <Select.Option value="private">private</Select.Option>
            <Select.Option value="public">public</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'root name is required' }]}
        >
          <Select placeholder="Select status">
            <Select.Option value="enable">enable</Select.Option>
            <Select.Option value="disable">disable</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="prefix"
          label="Root"
          rules={[{ required: false, message: 'root name is required' }]}
        >
          <Input placeholder="Please input" />
        </Form.Item>
        <Form.Item
          name="syncTo"
          label="Sync to"
          rules={[{ required: false, message: 'sync up with other bucket' }]}
        >
          <Select placeholder="Select bucket" mode="multiple" allowClear>
            {buckets.map((item) => {
              return (
                <Select.Option value={item.name} key={item.name}>
                  {item.name}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>
        <Form.Item
          name="isDefault"
          label="Default"
          valuePropName="checked"
          rules={[
            { required: false, message: 'make bucket as default storage' },
          ]}
        >
          <Switch />
        </Form.Item>
        <Divider plain>Config</Divider>
        {Object.entries(driver.properties).map(
          ([field, schema]: [string, any]) => {
            const config = bucket.config || {};
            return (
              <Form.Item
                key={field}
                name={`config.${field}`}
                rules={[{ required: driver.required?.includes(field) }]}
                help={schema.description}
                initialValue={config[field]}
                label={schema.label}
              >
                <Input placeholder={schema.label} />
              </Form.Item>
            );
          },
        )}
      </Form>
    </Modal>
  );
};

export default BindingForm;
