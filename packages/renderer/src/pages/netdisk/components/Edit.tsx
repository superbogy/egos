import { memo } from 'react';
import { Drawer, Form, Input, Select, Button, Descriptions } from 'antd';
import './edit.less';
import { FileSchema } from '@/services/file';
import { FileObjectSchema } from '@/services/file-object';

interface EditProps {
  currentItem: FileSchema | null;
  currentFolder: FileSchema | null;
  availableFolders: FileSchema[];
  onClose: () => void;
  onSave: (v: Partial<FileSchema>) => void;
  onSearch: (k: string) => void;
  visible: boolean;
}
export default memo((props: EditProps) => {
  const currentItem = props.currentItem || ({} as FileSchema);
  const currentFolder = props.currentFolder || ({} as FileSchema);
  const availableFolders = props.availableFolders || [];
  const file = currentItem.file || ({} as FileObjectSchema);
  const onClose = () => {
    props.onClose();
  };
  const onSave = (values: Partial<FileSchema>) => {
    props.onSave({ id: currentItem.id, ...values });
  };
  const parentFolders = [
    {
      value: currentItem.parentId,
      label: currentFolder.path,
    },
  ];
  availableFolders.forEach((item) => {
    if (item.id !== currentFolder.id) {
      parentFolders.push({
        value: item.id,
        label: item.path,
      });
    }
  });
  let timeout: NodeJS.Timeout | null = null;
  const fetch = (input: string) => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => props.onSearch(input), 500);
  };
  return (
    <div className="disk-edit-box">
      <Drawer
        placement="right"
        onClose={onClose}
        open={props.visible}
        width={480}
        className="disk-edit-box"
      >
        <Form
          name="basic"
          initialValues={currentItem}
          onFinish={onSave}
          autoComplete="off"
        >
          <Descriptions column={1} bordered>
            <Descriptions.Item label="文件名">
              <Form.Item
                name="filename"
                rules={[{ required: true, message: 'Please input filename' }]}
              >
                <Input value={currentItem.filename} bordered={false} />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="路径">
              <Form.Item
                name="path"
                rules={[{ required: true, message: 'Please input path!' }]}
              >
                <Input value={currentItem.path} bordered={false} />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="父目录">
              <Form.Item
                name="parentId"
                rules={[
                  { required: true, message: 'Please choose parent path!' },
                ]}
              >
                <Select
                  value={currentItem.parentId}
                  bordered={false}
                  options={parentFolders}
                  onSearch={fetch}
                  showSearch
                  filterOption={false}
                  notFoundContent={null}
                ></Select>
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="标签">
              <Form.Item name="tag" rules={[{ required: false }]}>
                <Input value={currentItem.tag || ''} bordered={false} />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="描述">
              <Form.Item name="description">
                <Input.TextArea value={currentItem.description || ''} />
              </Form.Item>
            </Descriptions.Item>
            <Descriptions.Item label="存储路径">
              <span>{file.remote || '-'}</span>
            </Descriptions.Item>
            {/* <Descriptions.Item label="bucket">
              <span>{currentItem.bucketId}</span>
            </Descriptions.Item> */}
            <Descriptions.Item label="类型">
              <span>{currentItem.type}</span>
            </Descriptions.Item>
            <Descriptions.Item label="size">
              <span>{file.size || '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              <span>{currentItem.createdAt}</span>
            </Descriptions.Item>
            <Descriptions.Item label="最后更新">
              <span>{currentItem.updatedAt}</span>
            </Descriptions.Item>
            <Descriptions.Item>
              <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                <Button type="primary" htmlType="submit">
                  save
                </Button>
              </Form.Item>
            </Descriptions.Item>
          </Descriptions>
        </Form>
      </Drawer>
    </div>
  );
});
