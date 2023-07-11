import classNames from 'classnames';
import { Fragment } from 'react';
import { PreviewProps } from './interface';

export default (props: PreviewProps) => {
  const { file } = props;
  console.log('vvvvideo controls', props);
  return (
    <Fragment>
      <video
        className={classNames('exhibit-media-item', [props.className])}
        controls={props.controls}
      >
        <source
          src={`${file.url?.replace('atom', 'egos')}?fileId=${file.id}#0.5`}
          type="video/mp4"
        />
      </video>
    </Fragment>
  );
};
