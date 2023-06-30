import React, { useEffect, useState } from 'react';
import 'video.js/dist/video-js.css';
import './video.less';

export default (props: any) => {
  const { file = {} } = props;
  const [url, setUrl] = useState('');
  useEffect(() => {
    setUrl(file.url);
  }, [file]);
  return (
    <React.Fragment key={url}>
      <div className="eg-video-box">
        <video width="100%" controls>
          <source src={url} type="video/mp4" />
          Your browser does not support HTML video.
        </video>
      </div>
    </React.Fragment>
  );
};
