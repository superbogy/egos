import classNames from 'classnames';
import { Fragment } from 'react';
import { PreviewProps } from './interface';

export default (props: PreviewProps) => {
  const { file, type } = props;
  return (
    <Fragment>
      <video
        className={classNames('exhibit-media-item', [props.className])}
        controls={props.controls}
      >
        <source
          src={`atom://egos-local?fileId=${file.objectId}&type=${type}#0.5`}
          type="video/mp4"
        />
      </video>
    </Fragment>
  );
};
