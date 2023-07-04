import { Image } from 'antd';
import { useState } from 'react';
export default (props: any) => {
  const { file = {} } = props;
  console.log('vvvvffff', file);
  const [visible, setVisible] = useState(false);
  return (
    <>
      <div>
        <Image.PreviewGroup
          preview={{ visible, onVisibleChange: (vis) => setVisible(vis) }}
        >
          <Image
            preview={{ visible: false, mask: false }}
            src={file.url}
            onClick={() => setVisible(true)}
          />
        </Image.PreviewGroup>
      </div>
    </>
  );
};
