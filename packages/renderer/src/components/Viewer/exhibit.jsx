import './exhibit.less';

import { FileUnknownOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import { getClassWithColor } from 'file-icons-js';
import { Fragment } from 'react';

export default (props) => {
  const file = props.file || {};
  const { boxClass, itemClass, avatarClass } = props;
  const fileClass = getClassWithColor('.' + file.ext);
  const getContent = () => {
    if (file.type === 'image') {
      return (
        <img
          className="exhibit-file-item"
          src={`file://${file.local}`}
          onClick={(e) => e.preventDefault()}
        />
      );
    }

    if (file.type === 'video') {
      return (
        <Fragment>
          <video className="exhibit-media-item" controls={props.controls}>
            <source
              src={`http://local-egos${file.local}#t=0.5`}
              type="video/mp4"
            />
          </video>
        </Fragment>
      );
    }

    return (
      <div className={classNames('exhibit-file-item', itemClass)}>
        {file.type === 'image' ? (
          <img
            src={`file://${file.local}`}
            onClick={(e) => e.preventDefault()}
            onError={console.log}
          />
        ) : file.type === 'video' ? (
          <Fragment>
            <video className="exhibit-media-item" controls={true}>
              <source
                src={`http://local-egos${file.local}#t=0.5`}
                type="video/mp4"
              />
            </video>
          </Fragment>
        ) : fileClass ? (
          <span
            className={classNames(
              fileClass,
              'exhibit-file-avatar',
              avatarClass,
            )}
            style={props.avatarStyle}
          />
        ) : (
          <span className="exhibit-file-avatar">
            <FileUnknownOutlined />
          </span>
        )}
      </div>
    );
  };
  return (
    <>
      <div
        className={classNames('exhibit-box', boxClass)}
        onDoubleClick={props.onDoubleClick}
      >
        {getContent()}
      </div>
    </>
  );
};
