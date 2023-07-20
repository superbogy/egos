import { PreviewProps } from './interface';
import classNames from 'classnames';

export default (props: PreviewProps) => {
  const { file, type } = props;
  return (
    <>
      <img
        className={classNames('exhibit-file-item', props.className)}
        src={`atom://egos-local?fileId=${file.objectId}&type=${type}`}
        onClick={(e) => e.preventDefault()}
      />
    </>
  );
};
