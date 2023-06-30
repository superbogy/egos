import { getViewer } from '@/components/preview';
import { CloudDownloadOutlined } from '@ant-design/icons';
import React, { useEffect } from 'react';
import { connect, useLocation } from 'umi';
import qs from 'querystring';
import './index.less';

const Index: React.FC = (props: any) => {
  const location = useLocation();
  const { dispatch } = props;
  const { view } = props;
  const query = qs.parse(location.search);
  useEffect(() => {
    dispatch({
      type: 'view/query',
      payload: query,
    });
  }, [location]);

  return (
    <div className="eg-share-detail">
      {view.fileObj ? getViewer({ file: view.fileObj }) : null}
      <div className="action-menu">
        <CloudDownloadOutlined />
      </div>
    </div>
  );
};

export default connect(({ view }: { view: any }) => ({ view }))(Index);
