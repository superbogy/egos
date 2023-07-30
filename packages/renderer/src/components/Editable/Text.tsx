import { useRef, useState } from 'react';
import classNames from 'classnames';
import './text.less';

export interface EditableTextProps {
  text: string;
  onChange: (text: string) => void;
  className?: string;
}

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
  const onBlur = () => {
    const value = inputRef.current?.value;
    if (!value) {
      return;
    }
    if (value === props.text) {
      setIsEdit(!isEdit);
      return;
    }
    Promise.resolve(props.onChange(value)).then(() => {
      setIsEdit(!isEdit);
    });
  };

  return (
    <>
      {!isEdit ? (
        <span className={props.className} onDoubleClick={handleEdit}>
          {props.text}
        </span>
      ) : (
        <input
          className={classNames('content-input', props.className)}
          defaultValue={props.text}
          ref={inputRef}
          onBlur={onBlur}
        />
      )}
    </>
  );
};
