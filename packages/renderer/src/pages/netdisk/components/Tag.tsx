import { useState } from 'react';
import { Form, Tag, Modal, Input } from 'antd';
import { Tag as TagInterface } from '../model';

interface TagProps {
  tag: TagInterface;
  onSave: (id: number, value: TagProps) => void;
}

export default (props: TagProps) => {
  const tag = props.tag;
  if (!tag) {
    return null;
  }
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [form] = Form.useForm();
  const handleOk = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();
    console.log(values);
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Tag color={tag.color} onClick={() => setIsModalOpen(true)}>
        {tag.name}
      </Tag>
      <Modal open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
        <Form
          name="Tag-edit"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          initialValues={tag}
          onFinish={console.log}
          autoComplete="off"
          form={form}
        >
          <Form.Item
            label="name"
            name="name"
            rules={[{ required: true, message: 'tag name' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="color"
            name="color"
            rules={[{ required: true, message: 'color' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
