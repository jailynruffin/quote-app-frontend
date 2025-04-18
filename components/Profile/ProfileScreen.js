import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LogOut, Trash2 } from 'lucide-react-native';

import { getAuth, signOut } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
} from 'firebase/firestore';
import { firebaseApp } from '../firebase/firebaseConfig';

export default function ProfileScreen({ navigation }) {
  const [userData,  setUserData]  = useState(null);
  const [userQuotes, setUserQuotes] = useState([]);

  /* ───────────────────────── Fetch user + their quotes ────────────────────── */
  const refreshProfile = useCallback(async () => {
    try {
      const auth = getAuth(firebaseApp);
      const db   = getFirestore(firebaseApp);
      const user = auth.currentUser;
      if (!user) return;

      /* 1.  User document ---------------------------------------------------- */
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserData({
          ...data,
          friends:           (data.friends           || []).filter(Boolean),
          incomingRequests:  (data.incomingRequests  || []).filter(Boolean),
        });
      }

      /* 2.  Quotes written by this user ------------------------------------- */
      const q     = query(collection(db, 'quotes'), where('userId', '==', user.uid));
      const qsnap = await getDocs(q);

      // sort newest → oldest on the client (avoids the index requirement)
      const quotes = qsnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));

      setUserQuotes(quotes);
    } catch (err) {
      console.error('Profile fetch error:', err);
      Alert.alert('Error', 'Could not load your profile.');
    }
  }, []);

  /* Refresh every time the screen gets focus */
  useFocusEffect(useCallback(() => { refreshProfile(); }, [refreshProfile]));

  /* ───────────────────────────── Handlers ─────────────────────────────────── */
  const handleDelete = async (quoteId) => {
    Alert.alert(
      'Delete quote?',
      'This can’t be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = getFirestore(firebaseApp);
              await deleteDoc(doc(db, 'quotes', quoteId));
              setUserQuotes(prev => prev.filter(q => q.id !== quoteId));
            } catch {
              Alert.alert('Error', 'Could not delete quote.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth(firebaseApp);
      await signOut(auth);
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  /* ───────────────────────────── Helpers ─────────────────────────────────── */
  const formatTimeAgo = (ts) => {
    const date = ts instanceof Date ? ts : ts?.toDate?.();
    if (!date) return '';
    const diff = (Date.now() - date.getTime()) / 1000;
    if (diff <   60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  /* ───────────────────────────── UI ──────────────────────────────────────── */
  function QuoteCard({ quote }) {
    const [poster, setPoster] = useState({ username: 'username', profilePic: '' });

    React.useEffect(() => {
      const fetchPoster = async () => {
        const db = getFirestore(firebaseApp);
        const u  = await getDoc(doc(db, 'users', quote.userId));
        if (u.exists()) setPoster(u.data());
      };
      fetchPoster();
    }, [quote.userId]);

    return (
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        <View style={styles.userRow}>
          {poster.profilePic ? (
            <Image source={{ uri: poster.profilePic }} style={styles.avatarSmall} />
          ) : (
            <View style={styles.avatarPlaceholderSmall}><Text>👤</Text></View>
          )}
          <Text style={styles.usernameSmall}>
            @{poster.username} · {formatTimeAgo(quote.timestamp)}
          </Text>
        </View>
        <TouchableOpacity style={styles.trashBtn} onPress={() => handleDelete(quote.id)}>
          <Trash2 size={18} color="#e57cd8" />
        </TouchableOpacity>
      </View>
    );
  }

  /* ───────────────────────── render ──────────────────────────────────────── */
  const friendCount   = userData?.friends?.length          || 0;
  const requestCount  = userData?.incomingRequests?.length || 0;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <LogOut size={22} color="#e57cd8" />
      </TouchableOpacity>

      {/* avatar */}
      <TouchableOpacity style={styles.avatarWrapper} onPress={() => navigation.navigate('EditProfile')}>
        {userData?.profilePic
          ? <Image source={{ uri: userData.profilePic }} style={styles.avatar} />
          : <View style={styles.avatarPlaceholder}><Text style={styles.avatarText}>👤</Text></View>}
      </TouchableOpacity>

      {/* basic info */}
      <Text style={styles.username}>@{userData?.username ?? 'username'}</Text>
      {userData?.bio
        ? <Text style={styles.bioText}>{userData.bio}</Text>
        : <Text style={styles.bioPlaceholder}>No bio yet.</Text>}

      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>

      {/* friends / requests */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={styles.metaText}>👥 {friendCount} friends</Text>
        <TouchableOpacity onPress={() => navigation.navigate('FriendRequests')}>
          <Text style={styles.metaText}>📩 {requestCount} pending requests</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      {/* user quotes */}
      <View style={styles.quotesSection}>
        <Text style={styles.quotesHeader}>Your Quotes</Text>
        {userQuotes.length === 0
          ? <Text style={styles.emptyQuotes}>You haven’t posted any quotes yet.</Text>
          : userQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}
      </View>
    </ScrollView>
  );
}



const styles = StyleSheet.create({
  scrollContent: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 120,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  logoutBtn: {
    position: 'absolute',
    top: 40,
    right: 24,
    padding: 6,
  },
  avatarWrapper: { marginBottom: 16 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3d6ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  username: { fontSize: 20, fontWeight: '600', color: '#e57cd8', marginBottom: 4 },
  bioText: { color: '#666', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  bioPlaceholder: {
    color: '#ccc',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  editButton: {
    borderWidth: 1,
    borderColor: '#e57cd8',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  editText: { color: '#e57cd8', fontWeight: '600', fontSize: 14 },
  metaText: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  divider: { width: '100%', height: 1, backgroundColor: '#eee', marginVertical: 16 },
  quotesSection: { width: '100%' },
  quotesHeader: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' },
  emptyQuotes: { color: '#aaa', fontStyle: 'italic', marginBottom: 16, paddingLeft: 4 },
  quoteCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  quoteText: { fontSize: 15, marginRight: 28 },
  trashBtn: { position: 'absolute', top: 10, right: 10 },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  avatarPlaceholderSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  usernameSmall: {
    fontSize: 13,
    color: '#888',
  },
});
