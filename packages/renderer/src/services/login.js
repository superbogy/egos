import User from './user';
import { ServiceError } from '@/lib/error';

export async function signIn(params) {
  try {
    const { username, password } = params;
    const user = await Promise.resolve(User.findOne({ username }));
    if (!user) {
      const err = new ServiceError({ message: 'user not found', code: 10404 });
      return err;
    }
    const verified = User.verify(password, user);
    if (!verified) {
      return new ServiceError({ message: 'password incorrect', code: 10403 });
    }
    return Promise.resolve(user);
  } catch (err) {
    return err;
  }
}

export async function signUp(params) {
  try {
    const { username, password } = params;
    const user = await User.findOne({ username, password });
    if (user) {
      const err = {
        err: true,
        code: 10400,
        message: 'user exists',
      };
      return Promise.reject(new ServiceError(err));
    }
    const newUser = await User.register(params);
    return Promise.resolve(newUser);
  } catch (err) {
    return err;
  }
}
