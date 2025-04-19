import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  getFirestore, doc, getDoc, getDocs, collection, query, where,
} from 'firebase/firestore';
import { firebaseApp } from '../firebase/firebaseConfig';
import { ArrowLeft } from 'lucide-react-native';

export default function QuoteLikesScreen() {
  const { quoteId } = useRoute().params;
  const navigation  = useNavigation();
  const db          = getFirestore(firebaseApp);

  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const quoteSnap = await getDoc(doc(db, 'quotes', quoteId));
      if (!quoteSnap.exists()) { setLoading(false); return; }

      const likeIds = quoteSnap.data().likesBy || [];
      if (likeIds.length === 0) { setLoading(false); return; }

      /* Firestore 'in' requires chunks of ≤10 */
      const chunks = [];
      while (likeIds.length) chunks.push(likeIds.splice(0, 10));

      const users = [];
      for (const c of chunks) {
        const snap = await getDocs(query(collection(db, 'users'), where('__name__', 'in', c)));
        snap.docs.forEach(d => users.push({ id: d.id, ...d.data() }));
      }
      setLikers(users);
      setLoading(false);
    })();
  }, [quoteId]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <ArrowLeft size={22} color="#e57cd8" />
      </TouchableOpacity>

      <Text style={styles.title}>Liked by</Text>

      {loading ? (
        <Text style={styles.loading}>Loading…</Text>
      ) : likers.length === 0 ? (
        <Text style={styles.empty}>No likes yet.</Text>
      ) : (
        likers.map(u => (
          <View key={u.id} style={styles.row}>
            {u.profilePic
              ? <Image source={{ uri: u.profilePic }} style={styles.avatar}/>
              : <View style={styles.avatarPlaceholder}><Text>👤</Text></View>}
            <Text style={styles.username}>@{u.username}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ paddingTop:70, paddingBottom:80, backgroundColor:'#fff', alignItems:'center' },
  back:{ position:'absolute', top:50, left:20, padding:6 },
  title:{ fontSize:20, fontWeight:'600', color:'#e57cd8', marginBottom:20 },
  loading:{ color:'#aaa', fontStyle:'italic' },
  empty:{ color:'#888', fontStyle:'italic', marginTop:40 },
  row:{ flexDirection:'row', alignItems:'center', gap:14, marginBottom:16 },
  avatar:{ width:36, height:36, borderRadius:18 },
  avatarPlaceholder:{
    width:36, height:36, borderRadius:18, backgroundColor:'#eee',
    justifyContent:'center', alignItems:'center',
  },
  username:{ fontSize:15, color:'#333' },
});
