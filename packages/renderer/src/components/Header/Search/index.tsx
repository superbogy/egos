import { SearchOutlined } from '@ant-design/icons';
import { AutoComplete, Input } from 'antd';
import useMergeValue from 'use-merge-value';
import React, { useRef } from 'react';
import classNames from 'classnames';
import styles from './index.less';

interface SearchProps {
  className?: string;
  defaultValue?: any;
  value?: any;
  onChange?: () => void;
  onVisibleChange?: (mode: any) => void;
  placeholder?: string;
  open?: any;
  defaultOpen?: any;
  options?: Record<string, any>[];
  onSearch?: (word: string) => void;
}
const HeaderSearch: React.FC<SearchProps> = (props) => {
  const {
    className,
    defaultValue,
    onVisibleChange,
    placeholder,
    defaultOpen,
    ...restProps
  } = props;
  const inputRef = useRef(null);
  const [value, setValue] = useMergeValue(defaultValue, {
    value: props.value,
    onChange: props.onChange,
  });
  const [searchMode, setSearchMode] = useMergeValue(defaultOpen || false, {
    value: props.open,
    onChange: onVisibleChange,
  });
  const inputClass = classNames(styles.input, {
    [styles.show]: searchMode,
  });
  return (
    <div
      className={classNames(className, styles.headerSearch)}
      onClick={() => {
        setSearchMode(true);

        if (searchMode && inputRef.current) {
          (inputRef.current as any).focus();
        }
      }}
      onTransitionEnd={({ propertyName }) => {
        if (propertyName === 'width' && !searchMode) {
          if (onVisibleChange) {
            onVisibleChange(searchMode);
          }
        }
      }}
    >
      <SearchOutlined
        key="Icon"
        style={{
          cursor: 'pointer',
        }}
      />
      <AutoComplete
        key="AutoComplete"
        className={inputClass}
        value={value}
        style={{
          height: 28,
          marginTop: -6,
        }}
        options={restProps.options}
        onChange={setValue}
      >
        <Input
          ref={inputRef}
          defaultValue={defaultValue}
          aria-label={placeholder}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              if (restProps.onSearch) {
                restProps.onSearch(value);
              }
            }
          }}
          onBlur={() => {
            setSearchMode(false);
          }}
        />
      </AutoComplete>
    </div>
  );
};

export default HeaderSearch;
