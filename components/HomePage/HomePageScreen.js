// HomePageScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert,
} from 'react-native';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import { Heart, Star, MessageSquare, Search } from 'lucide-react-native';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebase/firebaseConfig';
import { toggleLikeQuote } from '../firebase/quoteUtils';

/* ───────────────────────── helpers ───────────────────────── */
function formatTimeAgo(ts) {
  const date =
    ts instanceof Date               ? ts :
    ts?.toDate                       ? ts.toDate() :
    typeof ts?.seconds === 'number'  ? new Date(ts.seconds * 1000) :
    null;

  if (!date) return '';
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff <   60)   return 'now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

/* ───────────────────────── component ─────────────────────── */
export default function HomePageScreen() {
  const navigation                     = useNavigation();
  const isFocused                      = useIsFocused();

  /* Firebase handles */
  const auth = getAuth(firebaseApp);
  const db   = getFirestore(firebaseApp);
  const me   = auth.currentUser?.uid;

  /* state */
  const [quotes,      setQuotes]      = useState([]);
  const [searchText,  setSearchText]  = useState('');
  const [userResults, setUserResults] = useState([]);

  /* ─────────── listen to friend‑list changes ────────── */
  useEffect(() => {
    if (!me) return;
    const unsub = onSnapshot(doc(db, 'users', me), () => refreshFeed());
    return unsub;
  }, [me]);

  /* ───────────── fetch feed ───────────── */
  const refreshFeed = useCallback(() => {
    let unsubscribers = [];

    (async () => {
      try {
        if (!me) return;

        /* 1 ‑ pull my friend IDs */
        const selfSnap = await getDoc(doc(db, 'users', me));
        const friendIds = selfSnap.exists() ? (selfSnap.data().friends || []) : [];
        const ids = [me, ...friendIds].filter(Boolean);

        /* prune quotes that no longer belong */
        setQuotes(prev => prev.filter(q => ids.includes(q.userId)));

        if (ids.length === 0) return;

        /* 2 ‑ Firestore 'in' cap is 10 → chunk */
        const chunks = [];
        while (ids.length) chunks.push(ids.splice(0, 10));

        chunks.forEach(chunk => {
          const q = query(collection(db, 'quotes'), where('userId', 'in', chunk));
          const unsub = onSnapshot(q, snap => {
            setQuotes(prev => {
              const merged = [
                ...prev.filter(q => !chunk.includes(q.userId)),
                ...snap.docs.map(d => ({ id: d.id, ...d.data() })),
              ];
              return merged.sort(
                (a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
              );
            });
          });
          unsubscribers.push(unsub);
        });
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Could not load your feed.');
      }
    })();

    return () => unsubscribers.forEach(u => u());
  }, [me]);

  useFocusEffect(refreshFeed);

  /* ─────── user search bar ─────── */
  useEffect(() => {
    if (searchText.trim().length < 1) { setUserResults([]); return; }

    (async () => {
      const q = query(
        collection(db, 'users'),
        where('searchKeywords', 'array-contains', searchText.toLowerCase())
      );
      const snap = await getDocs(q);
      setUserResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [searchText]);

  /* ─────────────────── Quote card ─────────────────── */
  function QuoteCard({ quote }) {
    /* sync local like state with prop whenever quote doc updates */
    const [liked,  setLiked] = useState(quote.likesBy?.includes(me));
    const [likes,  setLikes] = useState(
      typeof quote.likes === 'number'
        ? quote.likes
        : (quote.likesBy?.length || 0)
    );
    const [poster, setPoster] = useState({ username: 'username', profilePic: '' });

    useEffect(() => {
      setLiked(quote.likesBy?.includes(me));
      setLikes(typeof quote.likes === 'number' ? quote.likes : (quote.likesBy?.length || 0));
    }, [quote.likesBy, quote.likes]);

    useEffect(() => {
      (async () => {
        const snap = await getDoc(doc(db, 'users', quote.userId));
        if (snap.exists()) setPoster(snap.data());
      })();
    }, [quote.userId, isFocused]);

    const isMine = quote.userId === me;

    /* tap / long‑press handlers */
    const handleToggleLike = async () => {
      try {
        await toggleLikeQuote(quote.id, liked);
        /* optimistically update UI; Firestore will confirm */
        setLiked(!liked);
        setLikes(l => l + (liked ? -1 : 1));
      } catch (err) {
        console.error(err);
      }
    };

    const handleShowLikers = () => {
      if (isMine && likes > 0)
        navigation.navigate('QuoteLikes', { quoteId: quote.id });
    };

    return (
      <View style={[
        styles.quoteCard,
        !isMine && { backgroundColor: '#f7f7f7' }, // grey for friends
      ]}>
        <Text style={styles.quoteText}>"{quote.text}"</Text>

        <View style={styles.userRow}>
          {poster.profilePic
            ? <Image source={{ uri: poster.profilePic }} style={styles.avatar}/>
            : <View style={styles.avatarPlaceholder}><Text>👤</Text></View>}
          <Text style={styles.username}>
            @{poster.username} · {formatTimeAgo(quote.timestamp)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleToggleLike}
            onLongPress={handleShowLikers}
            delayLongPress={300}
            style={styles.actionIcon}
          >
            <Heart size={20} color="#e57cd8" fill={liked ? '#e57cd8' : 'none'} />
            <Text style={styles.iconText}>{likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionIcon}>
            <Star size={20} color="#e57cd8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionIcon}>
            <MessageSquare size={20} color="#e57cd8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ────────────────────────── UI ─────────────────────────── */
  return (
    <View style={styles.container}>
      {/* search bar + dynamic results */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <Search size={18} color="#e57cd8" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search quotes, friends..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {userResults.length > 0 && (
          <View style={styles.userResults}>
            {userResults.map(u => (
              <TouchableOpacity
                key={u.id}
                style={styles.userRowResult}
                onPress={() => {
                  setSearchText('');
                  setUserResults([]);
                  navigation.navigate('ViewOtherProfile', { userId: u.id });
                }}
              >
                {u.profilePic
                  ? <Image source={{ uri: u.profilePic }} style={styles.avatarSmall}/>
                  : <View style={styles.avatarPlaceholderSmall}><Text>👤</Text></View>}
                <View>
                  <Text style={{ fontWeight: '500' }}>{u.name}</Text>
                  <Text style={{ color: '#888' }}>@{u.username}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.divider} />
      </View>

      {/* feed */}
      <ScrollView contentContainerStyle={styles.feed}>
        {quotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Your feed is empty. Follow friends or add quotes to get started!
            </Text>
          </View>
        ) : (
          quotes.map(q => <QuoteCard key={q.id} quote={q} />)
        )}
      </ScrollView>
    </View>
  );
}

/* ────────────────────────── styles ───────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60 },

  /* search */
  searchContainer: { marginHorizontal: 20 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333' },

  userResults: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
    gap: 10,
  },
  userRowResult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee' },
  avatarPlaceholderSmall: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee',
    justifyContent: 'center', alignItems: 'center',
  },
  divider: { height: 2, backgroundColor: '#e57cd8', marginTop: 14, borderRadius: 4 },

  /* feed */
  feed: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', textAlign: 'center', maxWidth: 260 },

  /* quote card */
  quoteCard: {
    backgroundColor: '#fff',   // your own
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 6,
  },
  quoteText: { fontSize: 16, color: '#333', marginBottom: 14 },

  /* poster row */
  userRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee', marginRight: 8 },
  avatarPlaceholder: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#eee',
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  username: { fontSize: 14, color: '#888' },

  /* actions */
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 18 },
  actionIcon: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconText: { fontSize: 13, color: '#999', marginLeft: 2 },
});
