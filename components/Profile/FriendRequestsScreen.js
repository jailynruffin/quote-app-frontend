// FriendRequestsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import {
  getAuth
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc
} from 'firebase/firestore';
import { firebaseApp } from '../firebase/firebaseConfig';
import { acceptFriendRequest, declineFriendRequest } from '../firebase/friendUtils';
import { useIsFocused } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';


export default function FriendRequestsScreen({ navigation }) {
  const [incomingUsers, setIncomingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      const auth = getAuth(firebaseApp);
      const db = getFirestore(firebaseApp);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const { incomingRequests = [] } = userSnap.data();
      const userDocs = await Promise.all(
        incomingRequests.map(uid => getDoc(doc(db, 'users', uid)))
      );

      const userList = userDocs
        .filter(docSnap => docSnap.exists())
        .map(d => ({ uid: d.id, ...d.data() }));

      setIncomingUsers(userList);
      setLoading(false);
    };

    fetchRequests();
  }, [isFocused]);

  const handleAccept = async (uid) => {
    try {
      await acceptFriendRequest(uid);
      setIncomingUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDecline = async (uid) => {
      try {
      await declineFriendRequest(uid);
        setIncomingUsers(prev => prev.filter(u => u.uid !== uid));
      } catch (err) {
        Alert.alert('Error', err.message);
      }
    };

  return (
    
    <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
        >
        <ArrowLeft size={22} color="#e57cd8" />
        </TouchableOpacity>

      <Text style={styles.title}>Friend Requests</Text>

      {loading ? (
        <Text style={styles.loading}>Loading...</Text>
      ) : incomingUsers.length === 0 ? (
        <Text style={styles.empty}>No friend requests right now.</Text>
      ) : (
        incomingUsers.map(user => (
          <View key={user.uid} style={styles.card}>
            {user.profilePic ? (
              <Image source={{ uri: user.profilePic }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text>👤</Text>
              </View>
            )}

            <View style={styles.info}>
              <Text style={styles.username}>@{user.username}</Text>
              {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => handleAccept(user.uid)} style={styles.acceptBtn}>
                <Text style={styles.btnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDecline(user.uid)} style={styles.declineBtn}>
                <Text style={styles.btnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 80,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#e57cd8',
    marginBottom: 20,
    alignSelf: 'center',
  },
  loading: {
    textAlign: 'center',
    color: '#aaa',
    fontStyle: 'italic',
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bio: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    backgroundColor: '#e57cd8',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  declineBtn: {
    backgroundColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    zIndex: 10,
  },
  
  header: {
    fontSize: 22,
    fontWeight: '600',
    color: '#e57cd8',
    textAlign: 'center',
    marginTop: 48,
    marginBottom: 20,
  },  
  headerContainer: {
    position: 'relative',
    marginBottom: 10,
  },  
});
