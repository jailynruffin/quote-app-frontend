import React, { useState, useContext } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { getAuth } from 'firebase/auth'
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { firebaseApp } from '../firebase/firebaseConfig'
import { QuoteContext } from '../context/QuoteContext'

export default function AddQuoteScreen({ navigation }) {
  const [quote, setQuote] = useState('')
  const { addQuote } = useContext(QuoteContext)

  const handleSubmit = async () => {
    if (quote.trim() === '') {
      Alert.alert('Oops!', 'Please enter a quote before submitting.')
      return
    }

    try {
      const auth = getAuth(firebaseApp)
      const db = getFirestore(firebaseApp)
      const user = auth.currentUser

      if (!user) {
        Alert.alert('Error', 'You must be logged in to post a quote.')
        return
      }

      const newQuote = {
        userId: user.uid,
        text: quote.trim(),
        timestamp: serverTimestamp(),
        visibility: 'public',       // you can add a toggle later for 'private' or 'group'
        likes: 0,
      }

      const docRef = await addDoc(collection(db, 'quotes'), newQuote)

      // Add to context for immediate feedback
      console.log('handleSubmit → sending', {
        ...newQuote, id: 'X', time: Date.now()
      });
      addQuote({ ...newQuote, id: docRef.id, timestamp: new Date() })

      setQuote('')
      Alert.alert('Success!', 'Your quote has been posted.')
      navigation.navigate('Home')
    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Add a Quote</Text>
      <TextInput
        value={quote}
        onChangeText={setQuote}
        placeholder="Write your quote here..."
        placeholderTextColor="#aaa"
        multiline
        numberOfLines={5}
        maxLength={280}
        style={styles.input}
      />
      <Text style={styles.charCount}>
        {quote.length} / 280
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Quote</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 80,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e57cd8',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlignVertical: 'top',
    color: '#333',
    height: 150,
    marginBottom: 20,
  },
  charCount: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginRight: 2,
    fontSize: 12,
    color: '#999',
  },
  button: {
    backgroundColor: '#e57cd8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
})
