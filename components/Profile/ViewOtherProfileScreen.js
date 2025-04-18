// ViewOtherProfileScreen.js 
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
import { ArrowLeft } from 'lucide-react-native';

export default function ViewOtherProfileScreen() {
  const { userId } = useRoute().params;
  const nav = useNavigation();
  const auth = getAuth(firebaseApp);
  const db   = getFirestore(firebaseApp);
  const me   = auth.currentUser?.uid;

  const [user,   setUser]   = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [status, setStatus] = useState('loading');

  /* realtime listener for profile + status */
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'users', userId), snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      setUser(data);

      if (data.friends?.includes(me))                 setStatus('friends');
      else if (data.incomingRequests?.includes(me))   setStatus('pendingIncoming');
      else if (data.outgoingRequests?.includes(me))   setStatus('pendingOutgoing');
      else                                            setStatus('none');
    });
    return () => unsub();
  }, [userId]);

  /* refresh quotes if we become friends */
  useEffect(() => {
    if (status !== 'friends' && me !== userId) { setQuotes([]); return; }

    (async () => {
      const q    = query(collection(db, 'quotes'), where('userId','==', userId));
      const snap = await getDocs(q);
      setQuotes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })();
  }, [status, userId]);

  /* single action handler */
  const handleAction = async () => {
    try {
      if (status === 'none')             await sendFriendRequest(userId);
      else if (status === 'pendingOutgoing') await cancelFriendRequest(userId);
      else if (status === 'pendingIncoming') await acceptFriendRequest(userId);
      else if (status === 'friends')         await removeFriend(userId);
    } catch (err) { Alert.alert('Error', err.message); }
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

      {me !== userId && (
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
      )}

      {/* quotes (visible only when friends or viewing yourself) */}
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
              borderRadius:20, marginTop:12 },
  actionTxt:{ color:'#fff', fontWeight:'600' },
  quotesSection:{ width:'100%', marginTop:30, paddingHorizontal:24 },
  qHeader:{ fontSize:16, fontWeight:'600', marginBottom:10 },
  quoteCard:{ backgroundColor:'#f7f7f7', padding:14, borderRadius:10, marginBottom:10 },
});
