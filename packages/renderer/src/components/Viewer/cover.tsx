import { PreviewProps } from './interface';
import Image from './image';
import Video from './video';
import Uploading from './uploading';
import Encrypt from './encrypt';
import Common from './common';

export default (props: PreviewProps) => {
  const { file } = props;
  const fileType = file.file?.type || '';
  if (!file) {
    return null;
  }
  if (file.status === 'uploading') {
    return <Uploading {...props} />;
  }
  if (file.isEncrypt) {
    return <Encrypt {...props} />;
  }
  if (fileType === 'video') {
    return <Video {...props} />;
  }
  if (fileType === 'image') {
    return <Image {...props} />;
  }
  return <Common {...props} />;
};
