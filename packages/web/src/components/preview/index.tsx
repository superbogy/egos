import { CloudDownloadOutlined } from '@ant-design/icons';
import { Modal } from 'antd';
import { useState } from 'react';
import File from './File';
import Image from './Image';
import Video from './Video';

export const getViewer = (props: any) => {
  const { file } = props;
  if (!file) {
    return null;
  }
  if (file.type === 'image') {
    return <Image {...props} />;
  }
  if (file.type === 'video') {
    return <Video {...props} />;
  }
  return <File {...props} />;
};

export type ViewerProps = {
  visible: boolean;
  file: {
    id: string;
    url: string;
    type: string;
  };
};
const FileViewer = (props: ViewerProps) => {
  const { file } = props;
  const [visible, setVisible] = useState(false);
  const handleCancel = () => {
    setVisible(!visible);
  };
  return (
    <Modal open={visible} onCancel={handleCancel}>
      <div className="eg-share-detail">
        {getViewer({ file })}
        <div className="action-menu">
          <CloudDownloadOutlined />
        </div>
      </div>
    </Modal>
  );
};

export default FileViewer;
