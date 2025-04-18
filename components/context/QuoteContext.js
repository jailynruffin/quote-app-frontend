// context/QuoteContext.js
import React, { createContext, useEffect, useRef, useState } from 'react';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { firebaseApp } from '../firebase/firebaseConfig';

export const QuoteContext = createContext();

/* ────────────────────────────────────────────────────────────── */

export const QuoteProvider = ({ children }) => {
  const [quotes, setQuotes] = useState([]);
  const latestIds = useRef(new Set());          // prevents duplicates

  /* 1 ─ Live‑sync with Firestore */
  useEffect(() => {
    const db = getFirestore(firebaseApp);
    const q = query(collection(db, 'quotes'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, snap => {
      const fromServer = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        // filter out any bad/malformed rows
        .filter(q => typeof q.text === 'string' && q.text.trim().length)
        // normalise timestamp so <Text> can format it
        .map(q => ({
          ...q,
          timestamp:
            q.timestamp instanceof Timestamp ? q.timestamp.toDate() : q.timestamp,
        }));

      // remember ids we already showed to avoid duplicates
      fromServer.forEach(q => latestIds.current.add(q.id));
      setQuotes(fromServer);
    });

    return unsubscribe;           // cleanup listener on unmount
  }, []);

  /* 2 ─ Optimistic insert after addDoc in AddQuoteScreen */
  const addQuote = quoteObj => {
    if (!quoteObj || typeof quoteObj.text !== 'string') return;

    // skip if the listener has already sent this doc
    if (latestIds.current.has(quoteObj.id)) return;

    latestIds.current.add(quoteObj.id);
    setQuotes(prev => [quoteObj, ...prev]);
  };

  return (
    <QuoteContext.Provider value={{ quotes, addQuote }}>
      {children}
    </QuoteContext.Provider>
  );
};
