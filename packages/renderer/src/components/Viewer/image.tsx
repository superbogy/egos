import { PreviewProps } from './interface';
import classNames from 'classnames';

export default (props: PreviewProps) => {
  const { file } = props;
  return (
    <>
      <img
        className={classNames('exhibit-file-item', props.className)}
        src={`${file.url}?fileId=${file.id}`}
        onClick={(e) => e.preventDefault()}
      />
    </>
  );
};
