import React, { memo, useState, useRef } from 'react';
// import ContentEditable from 'react-contenteditable';

export default memo((props) => {
  const { id, text } = props;
  const [content, setContent] = useState(text);
  const ref = useRef();
  const handleEnter = (e) => {
    const value = ref.current ? ref.current.lastHtml : '';
    if (e.key === 'Enter') {
      e.preventDefault();
      props.onBlur(id, value);
    }
  };

  const handleBlur = () => {
    const value = ref.current ? ref.current.lastHtml : '';
    props.onBlur(id, value);
  };

  return (
    <>
      <div
        html={content}
        className="editable-album-name"
        tagName="article"
        ref={ref}
        onBlur={handleBlur}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleEnter}
      />
    </>
  );
});
