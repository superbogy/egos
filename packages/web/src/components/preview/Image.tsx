import { Image } from 'antd';
import { useState } from 'react';
export default (props: any) => {
  const { file = {} } = props;
  const [visible, setVisible] = useState(false);
  return (
    <>
      <Image
        preview={{ visible: false }}
        src={file.url}
        onClick={() => setVisible(true)}
      />
      <div style={{ display: 'none' }}>
        <Image.PreviewGroup
          preview={{ visible, onVisibleChange: (vis) => setVisible(vis) }}
        ></Image.PreviewGroup>
      </div>
    </>
  );
};
