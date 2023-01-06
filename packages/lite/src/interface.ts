export type Dict = {
  [key: string]: any;
};

export interface Connection {
  filename: string;
  mode?: number;
  driver?: any;
}
