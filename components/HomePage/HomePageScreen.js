import React, { useContext, useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native'
import { QuoteContext } from '../context/QuoteContext'
import { Heart, Star, MessageSquare, Search } from 'lucide-react-native'
import { getFirestore, doc, getDoc } from 'firebase/firestore'
import { firebaseApp } from '../firebase/firebaseConfig'

export default function HomePageScreen() {
  const { quotes } = useContext(QuoteContext)

  function formatTimeAgo(timestamp) {
    if (!timestamp?.toDate) return ''
    const date = timestamp.toDate()
    const now = new Date()
    const diff = (now - date) / 1000

    if (diff < 60) return 'now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return date.toLocaleDateString()
  }

  function QuoteCard({ quote }) {
    const [liked, setLiked] = useState(false)
    const [likes, setLikes] = useState(quote.likes || 0)
    const [poster, setPoster] = useState({ username: 'username', profilePic: '' })

    useEffect(() => {
      const fetchPosterData = async () => {
        const db = getFirestore(firebaseApp)
        const userRef = doc(db, 'users', quote.userId)
        const userSnap = await getDoc(userRef)
        if (userSnap.exists()) {
          setPoster(userSnap.data())
        }
      }
      fetchPosterData()
    }, [quote.userId])

    const handleLike = () => {
      setLiked(!liked)
      setLikes(likes + (liked ? -1 : 1))
    }

    return (
      <View style={styles.quoteCard}>
        <Text style={styles.quoteText}>
          "{quote.text}"
        </Text>

        <View style={styles.userRow}>
          {poster.profilePic ? (
            <Image source={{ uri: poster.profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={{ fontSize: 16 }}>👤</Text>
            </View>
          )}
          <Text style={styles.username}>
            @{poster.username} · {formatTimeAgo(quote.timestamp)}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleLike} style={styles.actionIcon}>
            <Heart color="#e57cd8" fill={liked ? '#e57cd8' : 'none'} size={20} />
            <Text style={styles.iconText}>{likes}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionIcon}>
            <Star color="#e57cd8" size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionIcon}>
            <MessageSquare color="#e57cd8" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    )
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
          />
        </View>
        <View style={styles.divider} />
      </View>

      <ScrollView contentContainerStyle={styles.feed}>
        {quotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Your feed is empty. Follow friends or add quotes to get started!
            </Text>
          </View>
        ) : (
          quotes.map((q) => <QuoteCard key={q.id} quote={q} />)
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  searchContainer: {
    marginHorizontal: 20,
  },
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
    marginBottom: 16,
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
})
