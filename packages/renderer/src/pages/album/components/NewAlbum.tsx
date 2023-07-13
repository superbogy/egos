import React from 'react';
import { Modal } from 'antd';
import { Form, Input, Select, Button } from 'antd';
import { AlbumSchema } from '@/services/album';

const layout = {
  labelCol: {
    span: 8,
  },
  wrapperCol: {
    span: 16,
  },
};
interface FormProps {
  visible: boolean;
  handleOk: () => void;
  handleCancel: () => void;
  onSave: (payload: Partial<AlbumSchema>) => void;
}

export default ({ handleOk, handleCancel, onSave, ...props }: FormProps) => {
  const onFinish = (values: Partial<AlbumSchema>) => {
    onSave(values);
  };

  return (
    <>
      <Modal
        title="新建相册"
        open={props.visible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
      >
        <Form {...layout} name="nest-messages" onFinish={onFinish}>
          <Form.Item
            name="name"
            label=" 相册名"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="multiple">
              <Select.Option value="demo">Demo</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea />
          </Form.Item>
          <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 8 }}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
