import { Form, Input, Modal } from 'antd';

interface CryptProps {
  type: string;
  fileItem: any;
  visible: boolean;
  onOk: (payload: { password: string }) => void;
}
export default (props: CryptProps) => {
  const { type, fileItem, visible } = props;
  console.log(fileItem);
  const [form] = Form.useForm();
  const handleOk = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();
    console.log(values);
    props.onOk(values);
  };
  return (
    <>
      <Modal open={visible} onOk={handleOk} onCancel={console.log} title={type}>
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
