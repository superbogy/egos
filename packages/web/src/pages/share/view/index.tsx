import { getViewer } from '@/components/preview';
import { CloudDownloadOutlined } from '@ant-design/icons';
import React, { useEffect } from 'react';
import { connect, useLocation, useNavigate } from 'umi';
import qs from 'query-string';
import './index.less';

const Index: React.FC = (props: any) => {
  const location = useLocation();
  const { dispatch } = props;
  const { view } = props;
  const nav = useNavigate();
  console.log('vvview', view);
  const query = qs.parse(location.search);
  useEffect(() => {
    dispatch({
      type: 'view/query',
      payload: query,
    });
  }, [location]);

  const getDownloadUrl = () => {
    if (!view.fileObj) {
      return '#';
    }
    return view.fileObj.url + '&download=1';
  };

  return (
    <div className="eg-share-detail">
      {view.fileObj ? getViewer({ file: view.fileObj }) : null}
      <div className="action-menu">
        <a href={getDownloadUrl()}>
          <CloudDownloadOutlined />
        </a>
      </div>
    </div>
  );
};

export default connect(({ view }: { view: any }) => ({ view }))(Index);
