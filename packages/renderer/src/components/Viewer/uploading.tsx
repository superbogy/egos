import { LoadingOutlined } from '@ant-design/icons';
import { PreviewProps } from './interface';

export default (props: PreviewProps) => {
  if (props.file.status !== 'uploading') {
    return null;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
        height: '100%',
      }}
    >
      <span style={{ textAlign: 'center', fontSize: 16, width: '100%' }}>
        <LoadingOutlined />
      </span>
      <span style={{ textAlign: 'center' }}>上传中...</span>
    </div>
  );
};
