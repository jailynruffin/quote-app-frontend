// firebase/friendUtils.js
import {
  getFirestore, doc, updateDoc,
  arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from './firebaseConfig';

const db   = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

/* ───────────── send / cancel ───────────── */

export const sendFriendRequest = async (targetUid) => {
  const me = auth.currentUser?.uid;
  if (!me || me === targetUid) return;

  await Promise.all([
    updateDoc(doc(db, 'users', targetUid), { incomingRequests: arrayUnion(me) }),
    updateDoc(doc(db, 'users', me),        { outgoingRequests: arrayUnion(targetUid) }),
  ]);
};

export const cancelFriendRequest = async (targetUid) => {
  const me = auth.currentUser?.uid;
  if (!me || me === targetUid) return;

  await Promise.all([
    updateDoc(doc(db, 'users', targetUid), { incomingRequests: arrayRemove(me) }),
    updateDoc(doc(db, 'users', me),        { outgoingRequests: arrayRemove(targetUid) }),
  ]);
};

/* ───────────── accept / decline ───────────── */

export const acceptFriendRequest = async (fromUid) => {
  const me = auth.currentUser?.uid;
  if (!me || me === fromUid) return;

  await Promise.all([
    updateDoc(doc(db, 'users', fromUid), {
      outgoingRequests: arrayRemove(me),
      friends:          arrayUnion(me),
    }),
    updateDoc(doc(db, 'users', me), {
      incomingRequests: arrayRemove(fromUid),
      friends:          arrayUnion(fromUid),
    }),
  ]);
};

export const declineFriendRequest = async (fromUid) => {
  const me = auth.currentUser?.uid;
  if (!me || me === fromUid) return;

  await Promise.all([
    updateDoc(doc(db, 'users', me),       { incomingRequests: arrayRemove(fromUid) }),
    updateDoc(doc(db, 'users', fromUid),  { outgoingRequests: arrayRemove(me) }),
  ]);
};

/* ───────────── remove friend ───────────── */

export const removeFriend = async (targetUid) => {
  const me = auth.currentUser?.uid;
  if (!me || me === targetUid) return;

  await Promise.all([
    updateDoc(doc(db, 'users', targetUid), { friends: arrayRemove(me) }),
    updateDoc(doc(db, 'users', me),        { friends: arrayRemove(targetUid) }),
  ]);
};
