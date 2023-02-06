import './index.less';

import {
  CloseCircleOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { getClassWithColor } from 'file-icons-js';
import { path } from 'ramda';
import { useEffect, useState } from 'react';
import Exhibit from './exhibit';

export default (props) => {
  const { currentItem, dataIndex, list, visible } = props;
  const [activeItem, setActiveItem] = useState({});
  useEffect(() => {
    setActiveItem(currentItem);
  }, [currentItem]);

  const handlePre = (cur) => {
    const index = list.findIndex((v) => v.id === cur.id);
    if (index <= 0) {
      return false;
    }
    setActiveItem(list[index - 1]);
  };
  const handleNext = (cur) => {
    const index = list.findIndex((v) => v.id === cur.id);
    if (index >= list.length - 1) {
      return false;
    }
    setActiveItem(list[index + 1]);
  };
  const file = activeItem.file || {};
  const fileClass = getClassWithColor('.' + file.ext);
  return (
    <>
      <div
        className="viewer-wrapper"
        style={{
          visibility: visible ? 'visible' : 'hidden',
        }}
        key={activeItem.id || Date.now()}
      >
        <div className="viewer-close-bar" onClick={() => props.onClose()}>
          <CloseCircleOutlined />
        </div>
        <div className="viewer-content" key={activeItem.id}>
          <div className="viewer-arrow">
            <LeftOutlined onClick={() => handlePre(activeItem)} />
          </div>
          <div
            className="viewer-box"
            onClick={(e) => !e.defaultPrevented && props.onClose()}
          >
            <Exhibit
              file={file}
              boxClass="viewer-content"
              itemClass="view-file-item"
              avatarClass="viewer-file-cover"
              controls={props.controls}
            />
          </div>
          <div className="viewer-arrow">
            <RightOutlined onClick={() => handleNext(activeItem)} />
          </div>
          <div className="viewer-description">
            {dataIndex.map((item) => {
              return (
                <div className="item-body" key={item.alias}>
                  <span className="item-label">{item.alias}</span>
                  <span className="item-value">
                    {path(item.key, activeItem)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};