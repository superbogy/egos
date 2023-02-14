import { Input, Modal } from 'antd';

import { useEffect, useState } from 'react';

import qrCode from 'qrcode';
import './qr.less';

interface QRLoaderProps {
  visible: boolean;
  url: string;
}
const QRUploader = (props: QRLoaderProps) => {
  const [visible, setVisible] = useState(false);
  const [qrLink, setQrLink] = useState<string>('');
  useEffect(() => {
    setVisible(props.visible);
    if (props.url) {
      qrCode.toDataURL(props.url).then((dataUrl) => {
        setQrLink(dataUrl);
      });
    }
  }, [props.visible, props.url]);
  const handleCancel = () => {
    setVisible(!visible);
  };
  return (
    <>
      <Modal open={visible} onCancel={handleCancel}>
        <div className="qr-uploader-box">
          <div className="uploader-qrcode">
            {qrLink ? <img style={{ width: 304 }} src={qrLink} /> : null}
          </div>
          <div className="uploader-external">
            <Input value={props.url} style={{ width: 304 }} />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default QRUploader;
