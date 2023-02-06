import React, { useState } from 'react';
import { Modal, Form, Input, Select } from 'antd';

export default (props) => {
  const { currentFolder } = props;
  const [form] = Form.useForm();
  const modalProps = {
    title: '创建文件夹',
    visible: props.visible,
    centered: true,
    onOk() {
      form.validateFields().then((values) => {
        props.onOk(values);
      });
    },
    onCancel() {
      props.onCancel();
    },
  };

  return (
    <>
      <Modal {...modalProps}>
        <Form
          name="note"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 14 }}
          onFinish={console.log}
          onFinishFailed={console.log}
          autoComplete="off"
          form={form}
          initialValues={{ parentId: currentFolder.id, name: '' }}
        >
          <Form.Item
            label="文件夹名"
            name="name"
            rules={[{ required: true, message: 'Please input folder name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="上级目录"
            name="parentId"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Select
              style={{ width: 120 }}
              onChange={console.log}
              showArrow={false}
              value={currentFolder.id}
            >
              <Select.Option value={currentFolder.id}>{currentFolder.path}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
