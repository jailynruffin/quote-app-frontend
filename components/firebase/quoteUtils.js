// firebase/quoteUtils.js
import {
    getFirestore,
    doc,
    updateDoc,
    increment,
    arrayUnion,
    arrayRemove,
  } from 'firebase/firestore';
  import { getAuth } from 'firebase/auth';
  import { firebaseApp } from './firebaseConfig';
  
  const db   = getFirestore(firebaseApp);
  const auth = getAuth(firebaseApp);
  
  /**
   * Atomically like / unlike a quote.
   * @param {string} quoteId    Firestore doc ID
   * @param {boolean} currentlyLiked  true if the user has already liked
   */
  export const toggleLikeQuote = async (quoteId, currentlyLiked) => {
    const me = auth.currentUser?.uid;
    if (!me) return;
  
    const quoteRef = doc(db, 'quotes', quoteId);
  
    await updateDoc(quoteRef, currentlyLiked
      ? { likesBy: arrayRemove(me), likes: increment(-1) }
      : { likesBy: arrayUnion(me), likes: increment(1) }
    );
  };
  