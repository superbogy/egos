import request from '../utils/request';
import Base from './base';

class User extends Base {
  _table = 'users';

  async register(params) {
    const { username, password, email } = params;
    const user = {
      username,
      password: password,
      salt,
      email: email || '',
      emailStatus: 0,
      phone: '',
      phoneStatus: 0,
      gender: 'unknown',
      age: 0,
      profession: '',
    };
    return this.insert(user);
  }

  async verify(password, user) {
    if (password !== user.password) {
      return false;
    }

    return true;
  }
}

export default new User('users');

export async function query() {
  return request('/api/users');
}
export async function queryNotices() {
  return request('/api/notices');
}
