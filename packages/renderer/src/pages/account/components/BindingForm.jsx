import { Divider, Form, Input, Modal, Select, Switch } from 'antd';
import { assocPath, lens, props as Rprops, set } from 'ramda';
import { useEffect } from 'react';
export default (props) => {
  const { driver = {}, name, bucket, buckets } = props;
  const [form] = Form.useForm();
  const handleOk = async () => {
    const res = await form.validateFields();
    let payload = {};
    for (const key in res) {
      const val = res[key];
      const p = key.split('.');
      payload = set(lens(Rprops(p), assocPath(p)), val, payload);
    }
    props.handleOk(payload);
  };
  useEffect(() => {
    form.setFieldsValue({ ...bucket, driver: props.name });
  }, [props.name, bucket, form]);

  return (
    <Modal
      title={name}
      visible={props.visible}
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
          name="defaultBucket"
          label="Default"
          valuePropName="checked"
          rules={[
            { required: false, message: 'make bucket as default storage' },
          ]}
        >
          <Switch defaultChecked={false} />
        </Form.Item>
        <Divider plain>Config</Divider>
        {Object.entries(driver).map(([field, schema]) => {
          const config = bucket.config || {};
          return (
            <Form.Item
              key={field}
              name={`config.${field}`}
              rules={[{ required: schema.required }]}
              help={schema.description}
              initialValue={config[field]}
              label={schema.label}
            >
              <Input placeholder={schema.label} />
            </Form.Item>
          );
        })}
      </Form>
    </Modal>
  );
};
