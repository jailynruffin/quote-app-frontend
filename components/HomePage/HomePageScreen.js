// HomePageScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect, useIsFocused, useNavigation } from '@react-navigation/native';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, Alert,
} from 'react-native';
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

/* ───────────────────────── helpers ───────────────────────── */
function formatTimeAgo(ts) {
  const date =
    ts instanceof Date               ? ts :
    ts?.toDate                       ? ts.toDate() :
    typeof ts?.seconds === 'number'  ? new Date(ts.seconds * 1000) :
    null;

  if (!date) return '';
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff <   60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString();
}

/* ───────────────────────── component ─────────────────────── */
export default function HomePageScreen() {
  const [quotes,       setQuotes]       = useState([]);
  const [searchText,   setSearchText]   = useState('');
  const [userResults,  setUserResults]  = useState([]);
  const navigation                       = useNavigation();
  const isFocused                        = useIsFocused();

  /* ───────────── fetch my ID list (me + friends) ─────────── */
  const refreshFeed = useCallback(() => {
    let unsubscribers = [];

    (async () => {
      try {
        const auth = getAuth(firebaseApp);
        const db   = getFirestore(firebaseApp);
        const me   = auth.currentUser;
        if (!me) return;

        // 1. get my friend list
        const userSnap    = await getDoc(doc(db, 'users', me.uid));
        const friendIds   = userSnap.exists() ? (userSnap.data().friends || []) : [];
        const ids         = [me.uid, ...friendIds].filter(Boolean);

        if (ids.length === 0) {
          setQuotes([]);
          return;
        }

        // 2. split into chunks of ≤10 and listen to each
        const chunks = [];
        while (ids.length) chunks.push(ids.splice(0, 10));

        chunks.forEach(idChunk => {
          const q = query(
            collection(db, 'quotes'),
            where('userId', 'in', idChunk)
          );
          const unsub = onSnapshot(q, snap => {
            setQuotes(prev => {
              const merged = [
                ...prev.filter(q => !idChunk.includes(q.userId)),         // keep older
                ...snap.docs.map(d => ({ id: d.id, ...d.data() })),       // add/update
              ];
              // sort newest → oldest
              return merged.sort((a, b) =>
                (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)
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

    // cleanup
    return () => unsubscribers.forEach(u => u());
  }, []);

  useFocusEffect(refreshFeed);

  /* ──────── user search bar (unchanged except state) ─────── */
  useEffect(() => {
    if (searchText.trim().length < 1) {
      setUserResults([]);
      return;
    }
    (async () => {
      const db   = getFirestore(firebaseApp);
      const q    = query(
        collection(db, 'users'),
        where('searchKeywords', 'array-contains', searchText.toLowerCase())
      );
      const snap = await getDocs(q);
      setUserResults(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [searchText]);

  /* ───────────────────── Quote card ──────────────────────── */
  function QuoteCard({ quote }) {
    const [liked,  setLiked]  = useState(false);
    const [likes,  setLikes]  = useState(quote.likes || 0);
    const [poster, setPoster] = useState({ username: 'username', profilePic: '' });

    useEffect(() => {
      (async () => {
        const db       = getFirestore(firebaseApp);
        const snap     = await getDoc(doc(db, 'users', quote.userId));
        if (snap.exists()) setPoster(snap.data());
      })();
    }, [quote.userId, isFocused]);

    return (
      <View style={styles.quoteCard}>
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
          <TouchableOpacity onPress={() => { setLiked(!liked); setLikes(l => l + (liked ? -1 : 1)); }} style={styles.actionIcon}>
            <Heart size={20} color="#e57cd8" fill={liked ? '#e57cd8' : 'none'} />
            <Text style={styles.iconText}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><Star size={20} color="#e57cd8" /></TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><MessageSquare size={20} color="#e57cd8" /></TouchableOpacity>
        </View>
      </View>
    );
  }

  /* ────────────────────────── UI ─────────────────────────── */
  return (
    <View style={styles.container}>
      {/* search bar + user results */}
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
              <TouchableOpacity key={u.id}
                style={styles.userRowResult}
                onPress={() => {
                  setSearchText(''); setUserResults([]);
                  navigation.navigate('ViewOtherProfile', { userId: u.id });
                }}>
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
        {quotes.length === 0
          ? <View style={styles.emptyState}><Text style={styles.emptyText}>
              Your feed is empty. Follow friends or add quotes to get started!
            </Text></View>
          : quotes.map(q => <QuoteCard key={q.id} quote={q}/>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  searchContainer: { marginHorizontal: 20 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
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
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eee',
  },
  avatarPlaceholderSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: '#e57cd8',
    marginTop: 14,
    borderRadius: 4,
  },
  feed: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    maxWidth: 260,
  },
  quoteCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 6,
  },
  quoteText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eee',
    marginRight: 8,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  username: {
    fontSize: 14,
    color: '#888',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 18,
  },
  actionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconText: {
    fontSize: 13,
    color: '#999',
    marginLeft: 2,
  },
});
