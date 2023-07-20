import './exhibit.less';

import classNames from 'classnames';
import Cover from './cover';
import { FileSchema } from '@/services/file';

interface ExhibitProps {
  file: FileSchema;
  className?: string;
  boxClass?: string;
  itemClass?: string;
  avatarClass?: string;
  controls?: any;
  style?: Record<string, string | number>;
  onDoubleClick?: () => void;
  type: string;
}
export default (props: ExhibitProps) => {
  const file = props.file || {};
  if (!file) {
    return null;
  }
  const { boxClass } = props;
  // const fileClass = getClassWithColor('.' + file.ext);
  // const getContent = () => {
  //   if (file.type === 'image') {
  //     return (
  //       <img
  //         className={classNames('exhibit-file-item', [itemClass])}
  //         src={`atom://${file.local}?fileId=${file.id}`}
  //         onClick={(e) => e.preventDefault()}
  //       />
  //     );
  //   }
  //   if (file.type === 'video') {
  //     return (
  //       <Fragment>
  //         <video
  //           className={classNames('exhibit-media-item', [itemClass])}
  //           controls={props.controls}
  //         >
  //           <source
  //             src={`atom://${file.local}?fileId=${file.id}#0.5`}
  //             type="video/mp4"
  //           />
  //         </video>
  //       </Fragment>
  //     );
  //   }

  //   return (
  //     <div className={classNames('exhibit-file-item', itemClass)}>
  //       {fileClass ? (
  //         <span
  //           className={classNames(
  //             fileClass,
  //             'exhibit-file-avatar',
  //             avatarClass,
  //           )}
  //           style={props.avatarStyle}
  //         />
  //       ) : (
  //         <span className="exhibit-file-avatar">
  //           <FileUnknownOutlined />
  //         </span>
  //       )}
  //     </div>
  //   );
  // };
  return (
    <>
      <div
        className={classNames('exhibit-box', boxClass)}
        onDoubleClick={props.onDoubleClick}
      >
        <Cover {...props} />
      </div>
    </>
  );
};
