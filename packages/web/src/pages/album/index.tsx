import { Col, Image } from 'antd';
import type { Dispatch } from 'dva';
import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import { connect } from 'umi';
import './index.less';

type AlbumState = {
  list: any[];
  meta: { total: number };
};
type AlbumProps = {
  dispatch: Dispatch;
  album: AlbumState;
};

const App: React.FC<AlbumProps> = (props: AlbumProps) => {
  const { album } = props;
  console.log(album);
  const [visible, setVisible] = useState(false);
  const loadMore = () => {};
  return (
    <>
      <InfiniteScroll
        pageStart={0}
        hasMore={false}
        loadMore={loadMore}
        loader={
          <div className="loader" key={0}>
            Loading ...
          </div>
        }
      >
        <div
          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
        >
          {album.list.map((photo) => {
            return (
              <Col xs={12} sm={12} xl={6} key={photo.id}>
                <div className="eg-album-box">
                  <div className="eg-album-cover">
                    <Image src={photo.url} />
                  </div>

                  <div className="eg-album-name">
                    <span className="eg-album-text">{photo.filename}</span>
                  </div>
                </div>
              </Col>
            );
          })}
        </div>
      </InfiniteScroll>
      <div style={{ display: 'none' }}>
        <Image.PreviewGroup
          preview={{ visible, onVisibleChange: (vis) => setVisible(vis) }}
        >
          <Image src="https://gw.alipayobjects.com/zos/antfincdn/LlvErxo8H9/photo-1503185912284-5271ff81b9a8.webp" />
          <Image src="https://gw.alipayobjects.com/zos/antfincdn/cV16ZqzMjW/photo-1473091540282-9b846e7965e3.webp" />
          <Image src="https://gw.alipayobjects.com/zos/antfincdn/x43I27A55%26/photo-1438109491414-7198515b166b.webp" />
        </Image.PreviewGroup>
      </div>
    </>
  );
};

export default connect(({ album }: { album: AlbumState }) => ({ album }))(App);
