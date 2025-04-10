import { db as firebaseDB } from '../firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

export { collection, query, where, orderBy, onSnapshot };

const db = firebaseDB;

export { db };
