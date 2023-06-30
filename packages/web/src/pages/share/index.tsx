import { truncate } from '@/utils';
import {
  DownloadOutlined,
  FileUnknownOutlined,
  FolderFilled,
} from '@ant-design/icons';
import { Col, List, Pagination, Row } from 'antd';
import { getClassWithColor } from 'file-icons-js';
import humanFormat from 'human-format';
import qs from 'query-string';
import React, { useEffect } from 'react';
import { Link, connect, Dispatch, useLocation } from 'umi';
import './index.less';
import type { FileItem, ShareState } from './model';

type ShareProps = {
  share: ShareState;
  dispatch: Dispatch;
};
const timeScale = new humanFormat.Scale({
  seconds: 1,
  minutes: 60,
  hours: 3600,
  days: 86400,
  months: 2592000,
});

const Index: React.FC<ShareProps> = (props) => {
  const { share, dispatch } = props;
  const location = useLocation();
  const query = qs.parse(location.search);
  console.log('>>>>1', props);
  useEffect(() => {
    // const res = await service.query({});
    dispatch({
      type: 'share/query',
      payload: { ...query },
    });
  }, [location]);
  const getUrl = (item: FileItem): string => {
    const p = ['share'];
    const q: Record<string, any> = {};
    if (item.isFolder) {
      const ids = (query.parentIds as string) || '';
      const parentIds = ids.split(',').filter((i) => i);
      parentIds.push(item.id);
      q.parentIds = Array.from(new Set(parentIds)).join(',');
      q.expand = 1;
    } else {
      p.push(`/view`);
      q.sourceId = item.id;
    }
    p.push('?');
    p.push(
      qs.stringify({
        ...query,
        ...q,
      }),
    );
    return p.join('');
  };
  const getFileIcon = (item: FileItem) => {
    const cls = getClassWithColor(item.filename);
    if (cls) {
      return <span className={cls} />;
    }
    if (item.isFolder) {
      return <FolderFilled />;
    }
    return <FileUnknownOutlined />;
  };

  return (
    <div className="eg-share-box">
      <List
        itemLayout="horizontal"
        dataSource={share.list}
        renderItem={(item: any) => (
          <List.Item>
            <List.Item.Meta
              avatar={getFileIcon(item)}
              description={
                <Row>
                  <Col flex={1}>
                    <Link to={getUrl(item)}>
                      <span className="file-name">
                        {truncate(item.filename, 42)}
                      </span>
                    </Link>
                  </Col>
                  <Col span={4}>
                    <span className="file-meta">
                      {item.size ? humanFormat(Number(item.size)) : '-'}
                    </span>
                  </Col>
                  <Col span={5}>
                    <span className="file-meta">
                      {humanFormat(
                        new Date(item.expiredAt).getTime() - Date.now(),
                        { scale: timeScale },
                      )}
                    </span>
                  </Col>
                  <Col span={2}>
                    <DownloadOutlined />
                  </Col>
                </Row>
              }
            />
          </List.Item>
        )}
      />
      {share.meta.total > share.pageSize ? (
        <div className="share-pagination">
          <Pagination simple defaultCurrent={2} total={50} />
        </div>
      ) : null}
    </div>
  );
};

export default connect(({ share }: { share: ShareState }) => ({
  share,
}))(Index);
