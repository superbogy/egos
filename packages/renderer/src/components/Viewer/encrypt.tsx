import { LockFilled } from '@ant-design/icons';
import { PreviewProps } from './interface';

export default (props: PreviewProps) => {
  if (!props.file.isEncrypt) {
    return null;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignContent: 'center',
        height: 72,
        background: 'gray',
      }}
    >
      <span style={{ textAlign: 'center', fontSize: 16 }}>
        <LockFilled />
      </span>
      <span style={{ textAlign: 'center' }}>文件已加密</span>
    </div>
  );
};
