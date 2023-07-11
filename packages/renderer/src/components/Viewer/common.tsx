import { FileUnknownOutlined } from '@ant-design/icons';
import { PreviewProps } from './interface';
import classNames from 'classnames';
import { getClassWithColor } from 'file-icons-js';

export default (props: PreviewProps) => {
  const { file } = props;
  const fileClass = getClassWithColor('.' + file.file?.ext);
  return (
    <>
      <div className={classNames('exhibit-file-item', props.className)}>
        {fileClass ? (
          <span
            className={classNames('exhibit-file-avatar', fileClass)}
            style={props.style}
          />
        ) : (
          <span className="exhibit-file-avatar">
            <FileUnknownOutlined />
          </span>
        )}
      </div>
    </>
  );
};
