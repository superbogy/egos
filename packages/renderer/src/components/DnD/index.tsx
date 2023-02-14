import { FC, ReactNode } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend';
import './index.less';

export const ItemTypes = {
  BOX: 'box',
  CARD: 'card',
};

export interface DropProps {
  currentItem: any;
  selected?: number[];
  disable?: number[];
  style?: Record<string, string | number>;
  hoverStyle?: Record<string, string | number>;
  dropStyle?: Record<string, string | number>;
  dropType?: string;
  onUpload: ({
    files,
    parentId,
    currentItem,
  }: {
    files: any[];
    parentId?: number;
    currentItem?: any;
  }) => void;
  children: ReactNode | ReactNode[];
}
export const DropBox: FC<DropProps> = (props: DropProps) => {
  const {
    currentItem,
    selected = [],
    disable = [],
    hoverStyle = {},
    dropStyle = {},
  } = props;
  const accept = [ItemTypes.BOX, NativeTypes.FILE];
  if (props.dropType) {
    accept.push(props.dropType);
  }
  const [{ canDrop, isOver }, drop] = useDrop(() => {
    return {
      accept,
      drop: (item: any, monitor) => {
        if (monitor.getItemType() === NativeTypes.FILE) {
          return props.onUpload({
            files: item.files,
            parentId: currentItem.id,
            currentItem,
          });
        }
        return currentItem;
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
      canDrop(item) {
        if (selected.includes(currentItem.id)) {
          return false;
        }
        if (disable.includes(item.id)) {
          return false;
        }
        const isDisableItem = selected.find((id) => disable.includes(id));
        if (isDisableItem) {
          return false;
        }
        return item.id !== currentItem.id;
      },
    };
  }, [disable, selected, currentItem]);
  const getDropStyle = () => {
    const style = { ...props.style };
    const isActive = canDrop && isOver;
    if (isActive) {
      style.background = '#999';
      return { ...style, ...hoverStyle };
    }

    if (canDrop) {
      return {
        ...dropStyle,
        background: 'transparent',
      };
    }
    return { color: '#555', ...props.style };
  };
  return (
    <div ref={drop} role="folder" style={getDropStyle()}>
      <div className="drop-menu-item">{props.children}</div>
    </div>
  );
};

export interface DragProps {
  currentItem: any;
  dragType?: string;
  onMove?: ({ src, dest }: { src: any; dest: any }) => void;
  children: ReactNode | ReactNode[];
}
export const DragBox: FC<DragProps> = (props) => {
  const { currentItem } = props;
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: props.dragType || ItemTypes.BOX,
      item: { id: currentItem.id, isFolder: currentItem.isFolder },
      end: (item, monitor) => {
        const dropResult = monitor.getDropResult();
        if (item && dropResult && props.onMove) {
          props.onMove({ src: item, dest: dropResult });
        }
      },
      isDragging: () => {
        return true;
      },
      collect: (monitor) => {
        return {
          isDragging: monitor.isDragging(),
          handlerId: monitor.getHandlerId(),
        };
      },
    }),
    [currentItem],
  );
  const opacity = isDragging ? 0.4 : 1;
  return (
    <div ref={drag} role="Box" style={{ opacity }}>
      {props.children}
    </div>
  );
};

export interface SortableProps {
  currentItem: any;
  selected: number[];
  disable: number[];
  style: Record<string, string>;
  hoverStyle: Record<string, string>;
  dropStyle: Record<string, string>;
  onMove: (src: any, dest: any) => void;
  dropType?: string;
  onUpload?: ({
    files,
    parentId,
    currentItem,
  }: {
    files: any[];
    parentId?: number;
    currentItem: any;
  }) => void;
  children: ReactNode | ReactNode[];
}

export const Sortable: FC<SortableProps> = (props) => {
  const { currentItem, selected = [], disable, hoverStyle, dropStyle } = props;
  const [{ isDragging, itemType }, drag] = useDrag(
    {
      type: ItemTypes.CARD,
      item: { ...currentItem },
      collect: (monitor) => {
        return {
          isDragging: monitor.isDragging(),
          itemType: monitor.getItemType(),
        };
      },
      end: (item, monitor) => {
        const target = monitor.getDropResult();
        if (props.onMove && target) {
          props.onMove(currentItem, target);
        }
      },
    },
    [props.onMove, selected],
  );
  const accept = [ItemTypes.CARD];
  if (props.dropType) {
    accept.push(props.dropType);
  }
  const [{ canDrop, isOver, handlerId }, drop] = useDrop(
    {
      accept,
      collect(monitor) {
        return {
          handlerId: monitor.getHandlerId(),
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
        };
      },
      drop(item: any, monitor) {
        if (monitor.getItemType() === NativeTypes.FILE) {
          if (props.onUpload) {
            props.onUpload({
              files: item.files,
              parentId: currentItem.id,
              currentItem,
            });
          }
          return item;
        }
        return currentItem;
      },
      canDrop(item: any) {
        if (selected.includes(currentItem.id)) {
          return false;
        }
        if (disable.includes(item.id)) {
          return false;
        }
        return item.id !== currentItem.id;
      },
    },
    [currentItem, selected],
  );
  const getDropStyle = () => {
    const style: Record<string, string | number> = {
      ...props.style,
      opacity: isDragging ? 0 : 1,
    };
    const isActive = canDrop && isOver;
    if (isActive) {
      if (itemType === NativeTypes.FILE) {
        style.border = '2px solid #999';
      } else {
        style.borderLeft = '3px solid teal';
      }

      return { ...style, ...hoverStyle };
    }

    if (canDrop) {
      return {
        ...dropStyle,
        background: 'transparent',
      };
    }
    return { color: '#555', ...props.style };
  };
  return (
    <div
      ref={(node) => drag(drop(node))}
      style={getDropStyle()}
      data-handler-id={handlerId}
    >
      {props.children}
    </div>
  );
};
