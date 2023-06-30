import { ArrowLeftOutlined } from '@ant-design/icons';
import { Popover } from 'antd';
import QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';
import './basic.less';
import { Outlet } from 'umi';

const Basic: React.FC = (props: any) => {
  const { history } = props;
  console.log(props);
  const [qrLink, setQrLink] = useState('');
  useEffect(() => {
    QRCode.toDataURL(window.location.href).then((qrUrl: string) => {
      setQrLink(qrUrl);
    });
  }, [props.location]);
  return (
    <div className="eg-wrapper">
      <div className="eg-header">
        <div className="eg-title">
          {props.history?.length ? (
            <span onClick={() => history.goBack()}>
              <ArrowLeftOutlined />
            </span>
          ) : null}
        </div>
        <div className="eg-qrcode">
          {qrLink ? (
            <Popover content={<img src={qrLink} />} trigger="click">
              <img src={qrLink} height={48} />
            </Popover>
          ) : null}
        </div>
      </div>
      <Outlet />
    </div>
  );
};

export default Basic;
