// ViewOtherProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebase/firebaseConfig';
import {
  sendFriendRequest,
  cancelFriendRequest,
  removeFriend,
  acceptFriendRequest,
} from '../firebase/friendUtils';

export default function ViewOtherProfileScreen() {
  const route = useRoute();
  const { userId } = route.params;
  const auth = getAuth(firebaseApp);
  const db = getFirestore(firebaseApp);

  const [user, setUser] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState('loading');

  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    const fetchAll = async () => {
      const userSnap = await getDoc(doc(db, 'users', userId));
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setUser(userData);

        // Determine relationship status
        if (userData.friends?.includes(currentUid)) setStatus('friends');
        else if (userData.incomingRequests?.includes(currentUid)) setStatus('pendingIncoming');
        else if (userData.outgoingRequests?.includes(currentUid)) setStatus('pendingOutgoing');
        else setStatus('none');
      }

      const q = query(collection(db, 'quotes'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuotes(list);
    };

    fetchAll();
  }, [userId]);

  const handleAction = async () => {
    try {
      if (status === 'none') await sendFriendRequest(userId);
      else if (status === 'pendingOutgoing') await cancelFriendRequest(userId);
      else if (status === 'pendingIncoming') await acceptFriendRequest(userId);
      else if (status === 'friends') await removeFriend(userId);
      setStatus('loading');
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const actionText = {
    none: 'Add Friend',
    pendingOutgoing: 'Cancel Request',
    pendingIncoming: 'Accept Request',
    friends: 'Unfriend',
  };

  if (!user) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        {user.profilePic ? (
          <Image source={{ uri: user.profilePic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}><Text>👤</Text></View>
        )}
        <Text style={styles.username}>@{user.username}</Text>
        <Text style={styles.bio}>{user.bio || 'No bio'}</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleAction}>
          <Text style={styles.actionText}>{actionText[status]}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quotesSection}>
        <Text style={styles.quotesTitle}>Quotes</Text>
        {quotes.map(q => (
          <View key={q.id} style={styles.quoteCard}>
            <Text style={styles.quoteText}>"{q.text}"</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 60, paddingBottom: 100, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingHorizontal: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center'
  },
  username: { fontSize: 18, fontWeight: '600', color: '#e57cd8', marginTop: 10 },
  bio: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 6 },
  actionButton: {
    backgroundColor: '#e57cd8', paddingVertical: 10, paddingHorizontal: 24,
    borderRadius: 20, marginTop: 12
  },
  actionText: { color: '#fff', fontWeight: '600' },
  quotesSection: { marginTop: 30, paddingHorizontal: 24 },
  quotesTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  quoteCard: {
    backgroundColor: '#f7f7f7', padding: 14, borderRadius: 10,
    marginBottom: 10, shadowOpacity: 0.02, elevation: 2
  },
  quoteText: { fontSize: 14, color: '#333' },
});
