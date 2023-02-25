import { ipcEvent } from '@/lib/event';
import { Dispatch } from 'umi';
import { message } from 'antd';

export const successEvent = (dispatch: Dispatch, payload: any) => {
  dispatch({
    type: 'netdisk/init',
    payload: payload || {},
  });
};

export const registerUploadEvent = (dispatch: Dispatch) => {
  ipcEvent.register('file:upload', (ev: any, payload: any) => {
    switch (payload.status) {
      case 'success':
        successEvent(dispatch, payload);
        break;
      case 'processing':
        break;
      case 'error':
        message.error(payload.message);
      default:
        return null;
    }
  });
};
