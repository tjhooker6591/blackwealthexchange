// src/models/user.ts

import { Collection } from 'mongodb';
import { getDb } from '../lib/mongodb';    // named import
import { IUser } from '../../types/user';

/**
 * Returns the `users` collection typed as IUser.
 */
export async function getUserCollection(): Promise<Collection<IUser>> {
  const db = await getDb();
  return db.collection<IUser>('users');
}
