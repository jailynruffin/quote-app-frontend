// firebase/friendUtils.js
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
  } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { firebaseApp } from './firebaseConfig';
  
  const db = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  
  export const sendFriendRequest = async (targetUid) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || currentUid === targetUid) return;
  
    const targetRef = doc(db, 'users', targetUid);
    const currentRef = doc(db, 'users', currentUid);
  
  };
  
  export const cancelFriendRequest = async (targetUid) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || currentUid === targetUid) return;
  
    const targetRef = doc(db, 'users', targetUid);
    const currentRef = doc(db, 'users', currentUid);
  
    await updateDoc(targetRef, {
      incomingRequests: arrayRemove(currentUid),
    });
    await updateDoc(currentRef, {
      outgoingRequests: arrayRemove(targetUid),
    });
  };
  
  export const acceptFriendRequest = async (fromUid) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || currentUid === fromUid) return;
  
    const fromRef = doc(db, 'users', fromUid);
    const currentRef = doc(db, 'users', currentUid);
  
    await updateDoc(fromRef, {
      outgoingRequests: arrayRemove(currentUid),
      friends: arrayUnion(currentUid),
    });
    await updateDoc(currentRef, {
      incomingRequests: arrayRemove(fromUid),
      friends: arrayUnion(fromUid),
    });
    await updateDoc(targetRef, {
      incomingRequests: arrayUnion(currentUid),
      friends:          arrayUnion(),      // ensures field exists
      outgoingRequests: arrayUnion(),      // "
    });
    await updateDoc(currentRef, {
      outgoingRequests: arrayUnion(targetUid),
      friends:          arrayUnion(),
      incomingRequests: arrayUnion(),
    });
  };
  
  export const removeFriend = async (targetUid) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || currentUid === targetUid) return;
  
    const targetRef = doc(db, 'users', targetUid);
    const currentRef = doc(db, 'users', currentUid);
  
    await updateDoc(targetRef, {
      friends: arrayRemove(currentUid),
    });
    await updateDoc(currentRef, {
      friends: arrayRemove(targetUid),
    });
  };

  export const declineFriendRequest = async (fromUid) => {
      const me = auth.currentUser?.uid;
      if (!me || me === fromUid) return;
    
      await updateDoc(doc(db, 'users', me), {
        incomingRequests: arrayRemove(fromUid),
      });
      await updateDoc(doc(db, 'users', fromUid), {
        outgoingRequests: arrayRemove(me),
      });
    };
    
  