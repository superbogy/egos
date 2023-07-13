import React, { memo } from 'react';
import { Button, Image } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import { DragBox, DropBox } from '@/components/DnD';

export default memo((props) => {
  const { selected, currentItem } = props;
  return (
    <>
      <DropBox selected={selected} currentItem={currentItem}>
        <DragBox currentItem={currentItem}>
          <div key={currentItem.id}>
            <div className="img-box">
              <div
                className={`select-item imgWrapper ${
                  selected.includes(currentItem.id) ? 'selected' : ''
                }`}
                onContextMenu={props.onContextMenu(currentItem)}
              >
                {currentItem.type === 'image' ? (
                  <Image
                    alt={currentItem.id}
                    className="pic"
                    src={`file://${currentItem.local}`}
                    height={125}
                    // onClick={previewImage(currentItem)}
                  />
                ) : (
                  <video
                    className="media"
                    // onClick={previewImage(currentItem)}
                    // onContextMenu={handleContextMenu(currentItem)}
                    src={currentItem.local}
                    controls
                  ></video>
                )}

                <div className="imgOpts">
                  <Button
                    type="dashed"
                    shape="circle"
                    // onClick={(e) => onSelectChange(currentItem, e)}
                    icon={<CheckOutlined />}
                  />
                </div>
              </div>
            </div>
          </div>
          );
        </DragBox>
      </DropBox>
    </>
  );
});
