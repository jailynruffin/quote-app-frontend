import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native'
import { getAuth, signOut } from 'firebase/auth'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { firebaseApp } from '../firebase/firebaseConfig'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'


export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null)
  const [userQuotes, setUserQuotes] = useState([])


  useEffect(() => {
    const fetchUser = async () => {
      const auth = getAuth(firebaseApp)
      const db = getFirestore(firebaseApp)
      const user = auth.currentUser
      const quotesQuery = query(
        collection(db, 'quotes'),
        where('userId', '==', user.uid),
        where('visibility', '==', 'public'),
        orderBy('timestamp', 'desc')
      )
      const querySnap = await getDocs(quotesQuery)
      const quotes = querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setUserQuotes(quotes)      

      if (user) {
        const docRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setUserData(docSnap.data())
        }
      }
    }

    fetchUser()
  }, [])

  const handleLogout = async () => {
    try {
      const auth = getAuth(firebaseApp)
      await signOut(auth)
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    } catch (err) {
      Alert.alert('Error', 'Failed to log out.')
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Profile Picture */}
      <TouchableOpacity style={styles.avatarWrapper} onPress={() => navigation.navigate('EditProfile')}>
        {userData?.profilePic ? (
          <Image source={{ uri: userData.profilePic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
      </TouchableOpacity>
  
      {/* Username */}
      <Text style={styles.username}>
        @{userData?.username || 'username'}
      </Text>
  
      {/* Bio */}
      {userData?.bio ? (
        <Text style={styles.bioText}>{userData.bio}</Text>
      ) : (
        <Text style={styles.bioPlaceholder}>No bio yet.</Text>
      )}
  
      {/* Edit Profile */}
      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.editText}>Edit Profile</Text>
      </TouchableOpacity>
  
      <View style={styles.divider} />
  
      {/* Quotes */}
      <View style={styles.quotesSection}>
        <Text style={styles.quotesHeader}>Your Quotes</Text>
        {userQuotes.length === 0 ? (
          <Text style={styles.emptyQuotes}>You haven’t posted any quotes yet.</Text>
        ) : (
          userQuotes.map((q) => (
            <View key={q.id} style={styles.quoteCard}>
              <Text style={styles.quoteText}>"{q.text}"</Text>
            </View>
          ))
        )}
      </View>

  
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 120,
    paddingHorizontal: 24,
  },
  avatarWrapper: {
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f3d6ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e57cd8',
    marginBottom: 4,
  },
  bioText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
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
  editText: {
    color: '#e57cd8',
    fontWeight: '600',
    fontSize: 14,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    alignSelf: 'flex-start',
    color: '#333',
  },
  emptyText: {
    color: '#aaa',
    fontStyle: 'italic',
    marginTop: 8,
  },
  quoteCard: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  quoteText: {
    fontSize: 15,
    marginBottom: 6,
  },
  quoteMeta: {
    fontSize: 12,
    color: '#999',
  },
  logoutButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#e57cd8',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  quotesSection: {
    width: '100%',
    alignSelf: 'stretch',
  },
  quotesHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  emptyQuotes: {
    color: '#aaa',
    fontStyle: 'italic',
    marginBottom: 16,
    paddingLeft: 4,
  },  
})
