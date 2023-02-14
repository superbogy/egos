import { ReactNode } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

export default (props: { children: ReactNode }) => {
  return (
    <DndProvider backend={HTML5Backend}>
      <>{props.children}</>
    </DndProvider>
  );
};
