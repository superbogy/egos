import React, { FC } from 'react';
import SelectionArea, { SelectionEvent } from '@viselect/react';
import './index.less';

export interface SelectionProps {
  onBeforeDrag?: (ev: SelectionEvent) => boolean;
  className?: string;
  selectables: string;
  onMove: (ev: SelectionEvent) => void;
  onStart: (ev: SelectionEvent) => void;
  children?: React.ReactNode;
}
export const Selection: FC<SelectionProps> = (props: SelectionProps) => {
  return (
    <>
      <SelectionArea
        className={props.className || 'select-container'}
        onStart={props.onStart}
        onMove={props.onMove}
        selectables={props.selectables}
        onBeforeDrag={props.onBeforeDrag}
      >
        {props.children}
      </SelectionArea>
    </>
  );
};
