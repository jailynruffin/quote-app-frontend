import React, { useContext, useState, useEffect } from 'react';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { QuoteContext } from '../context/QuoteContext';
import { Heart, Star, MessageSquare, Search } from 'lucide-react-native';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { firebaseApp } from '../firebase/firebaseConfig';

export default function HomePageScreen() {
  const { quotes } = useContext(QuoteContext);
  const [searchText, setSearchText] = useState('');
  const [userResults, setUserResults] = useState([]);
  const navigation = useNavigation();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (searchText.trim().length < 1) {
      setUserResults([]);
      return;
    }

    const fetchUsers = async () => {
      const db = getFirestore(firebaseApp);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('searchKeywords', 'array-contains', searchText.toLowerCase()));
      const snap = await getDocs(q);
      const matches = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUserResults(matches);
    };

    fetchUsers();
  }, [searchText]);


  function formatTimeAgo(ts) {
    // Accepts Firestore Timestamp, JS Date, or the raw seconds/nanos object
    const date =
      ts instanceof Date               ? ts :
      ts?.toDate                       ? ts.toDate() :
      typeof ts?.seconds === 'number'  ? new Date(ts.seconds * 1000) :
      null;

    if (!date) return '';

    const diff = (Date.now() - date.getTime()) / 1000;   // seconds

    if (diff <   60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  }


  function QuoteCard({ quote }) {
    if (typeof quote.text !== 'string') return null;

    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(quote.likes || 0);
    const [poster, setPoster] = useState({ username: 'username', profilePic: '' });

    useEffect(() => {
      const fetchPosterData = async () => {
        const db = getFirestore(firebaseApp);
        const userRef = doc(db, 'users', quote.userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) setPoster(userSnap.data());
      };
      fetchPosterData();
    }, [quote.userId, isFocused]);

    const handleLike = () => {
      setLiked(!liked);
      setLikes(likes + (liked ? -1 : 1));
    };

    return (
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>"{quote.text}"</Text>
        <View style={styles.userRow}>
          {poster.profilePic ? (
            <Image source={{ uri: poster.profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{ fontSize: 16 }}>👤</Text>
            </View>
          )}
          <Text style={styles.username}>@{poster.username} · {formatTimeAgo(quote.timestamp)}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionIcon}>
            <Heart color="#e57cd8" fill={liked ? '#e57cd8' : 'none'} size={20} />
            <Text style={styles.iconText}>{likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><Star color="#e57cd8" size={20} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><MessageSquare color="#e57cd8" size={20} /></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            {userResults.map(user => (
              <TouchableOpacity
                key={user.id}
                onPress={() => {
                  setSearchText('');
                  setUserResults([]);
                  navigation.navigate('ViewOtherProfile', { userId: user.id });
                }}
                style={styles.userRowResult}
              >
                {user.profilePic ? (
                  <Image source={{ uri: user.profilePic }} style={styles.avatarSmall} />
                ) : (
                  <View style={styles.avatarPlaceholderSmall}><Text>👤</Text></View>
                )}
                <View>
                  <Text style={{ fontWeight: '500' }}>{user.name}</Text>
                  <Text style={{ color: '#888' }}>@{user.username}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.divider} />
      </View>

      <ScrollView contentContainerStyle={styles.feed}>
        {quotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your feed is empty. Follow friends or add quotes to get started!</Text>
          </View>
        ) : (
          quotes.map(q => <QuoteCard key={q.id} quote={q} />)
        )}
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
