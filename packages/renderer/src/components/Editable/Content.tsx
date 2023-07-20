import { useRef, useState } from 'react';
import './content.less';

export default (props: any) => {
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const handleEdit = () => {
    setIsEdit(!isEdit);
    setTimeout(() => {
      console.log(inputRef);
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(0, props.text.length, 'forward');
      }
    }, 100);
  };
  const handleChange = () => {
    setIsEdit(!isEdit);
  };
  return (
    <>
      {!isEdit ? (
        <span className={props.className} onDoubleClick={handleEdit}>
          {props.text}
        </span>
      ) : (
        <input
          className="content-input"
          value={props.text}
          ref={inputRef}
          onChange={handleChange}
          onBlur={handleChange}
        />
      )}
    </>
  );
};
