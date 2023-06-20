import { Form, Input, Modal } from 'antd';

interface CryptProps {
  type: string;
  visible: boolean;
  onOk: (payload: { password: string; type: string }) => void;
  onClose: any;
}
export default (props: CryptProps) => {
  const { type, visible } = props;
  const [form] = Form.useForm();
  const handleOk = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();
    props.onOk({ password: values.password, type });
  };
  return (
    <>
      <Modal
        open={visible}
        onOk={handleOk}
        onCancel={props.onClose}
        title={type}
      >
        <Form form={form}>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
