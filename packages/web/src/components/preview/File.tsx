import { FileUnknownFilled } from '@ant-design/icons';
import { Card } from 'antd';
import classNames from 'classnames';
import { getClass } from 'file-icons-js';

import 'file-icons-js/css/style.css';
import './file.less';

export default () => {
  const fClass = getClass('abc.png1') || '';
  return (
    <div className="file-card-box">
      <Card
        hoverable
        style={{ width: 240 }}
        cover={
          <div style={{ width: 240, textAlign: 'center' }}>
            {fClass ? (
              <span className={classNames(fClass, 'share-file-cover')} />
            ) : (
              <FileUnknownFilled style={{ fontSize: 68, padding: 12 }} />
            )}
          </div>
        }
      >
        <Card.Meta title="backf.png" description={'2020-09-11'} />
      </Card>
    </div>
  );
};
