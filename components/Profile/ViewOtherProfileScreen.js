// screens/ViewOtherProfileScreen.js
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  getFirestore, doc, onSnapshot, collection,
  query, where, getDocs,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '../firebase/firebaseConfig';
import {
  sendFriendRequest, cancelFriendRequest,
  acceptFriendRequest, removeFriend,
} from '../firebase/friendUtils';
import { ArrowLeft, X as XIcon } from 'lucide-react-native';

export default function ViewOtherProfileScreen() {
  const { userId }   = useRoute().params;
  const nav          = useNavigation();
  const auth         = getAuth(firebaseApp);
  const db           = getFirestore(firebaseApp);
  const me           = auth.currentUser?.uid;

  const [user,   setUser]   = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState('loading');

  /* realtime listener for profile + status */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', userId), snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      setUser(data);

      if (data.friends?.includes(me))               setStatus('friends');
      else if (data.incomingRequests?.includes(me)) setStatus('pendingOutgoing');
      else if (data.outgoingRequests?.includes(me)) setStatus('pendingIncoming');
      else                                          setStatus('none');
    });
    return unsub;
  }, [userId]);

  /* refresh quotes if we become friends */
  useEffect(() => {
    if (status !== 'friends' && me !== userId) { setQuotes([]); return; }

    (async () => {
      const snap = await getDocs(
        query(collection(db, 'quotes'), where('userId','==', userId))
      );
      setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [status, userId]);

  /* single action handler */
  const handleAction = async () => {
    try {
      // special: removing a friend needs confirmation
      if (status === 'friends') {
        const sure = await new Promise(res =>
          Alert.alert(
            'Remove friend?',
            `Are you sure you want to remove @${user.username}?`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => res(false) },
              { text: 'Remove', style: 'destructive', onPress: () => res(true) },
            ]
          ));
        if (!sure) return;
      }

      setStatus('loading');

      if (status === 'none')               await sendFriendRequest(userId);
      else if (status === 'pendingOutgoing') await cancelFriendRequest(userId);
      else if (status === 'pendingIncoming') await acceptFriendRequest(userId);
      else if (status === 'friends')         await removeFriend(userId);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const actionLabel = {
    none:            'Add Friend',
    pendingOutgoing: 'Requested',
    pendingIncoming: 'Accept Request',
    friends:         'Friends',
    loading:         '...',
  }[status];

  /* UI */
  if (!user) return <View style={styles.center}><Text>Loading…</Text></View>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* back */}
      <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
        <ArrowLeft size={22} color="#e57cd8" />
      </TouchableOpacity>

      {/* header */}
      {user.profilePic
        ? <Image source={{ uri:user.profilePic }} style={styles.avatar}/>
        : <View style={styles.avatarPlaceholder}><Text>👤</Text></View>}

      <Text style={styles.username}>@{user.username}</Text>
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      <Text style={styles.friendCount}>👥 {user.friends?.length || 0} friends</Text>

      {/* action button + red/pink X overlay */}
      {me !== userId && (
        <View style={{ position:'relative', marginTop:12 }}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              status!=='none' && status!=='pendingIncoming' && { opacity:0.5 },
            ]}
            onPress={handleAction}
            disabled={status==='loading'}
          >
            <Text style={styles.actionTxt}>{actionLabel}</Text>
          </TouchableOpacity>

          {status === 'friends' && (
            <TouchableOpacity
              onPress={handleAction}
              style={styles.removeX}
              disabled={status==='loading'}
            >
              <XIcon size={18} color="#ff4d9c" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* quotes */}
      {quotes.length > 0 && (
        <View style={styles.quotesSection}>
          <Text style={styles.qHeader}>Quotes</Text>
          {quotes.map(q => (
            <View key={q.id} style={styles.quoteCard}>
              <Text>"{q.text}"</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ paddingTop:60, paddingBottom:80, alignItems:'center', backgroundColor:'#fff' },
  center:{ flex:1, justifyContent:'center', alignItems:'center' },
  back:{ position:'absolute', top:50, left:20, padding:6 },
  avatar:{ width:100, height:100, borderRadius:50 },
  avatarPlaceholder:{ width:100, height:100, borderRadius:50, backgroundColor:'#eee',
                      justifyContent:'center', alignItems:'center' },
  username:{ fontSize:18, fontWeight:'600', color:'#e57cd8', marginTop:10 },
  bio:{ fontSize:14, color:'#888', textAlign:'center', marginTop:4 },
  friendCount:{ fontSize:14, color:'#888', marginTop:4 },
  actionBtn:{ backgroundColor:'#e57cd8', paddingVertical:10, paddingHorizontal:24,
              borderRadius:20 },
  actionTxt:{ color:'#fff', fontWeight:'600' },
  removeX:{            /* ► pink X overlay ◄ */
    position:'absolute',
    right:-10, top:-10,
    backgroundColor:'#fff',
    borderRadius:14,
    padding:2,
    elevation:4,
  },
  quotesSection:{ width:'100%', marginTop:30, paddingHorizontal:24 },
  qHeader:{ fontSize:16, fontWeight:'600', marginBottom:10 },
  quoteCard:{ backgroundColor:'#f7f7f7', padding:14, borderRadius:10, marginBottom:10 },
});
