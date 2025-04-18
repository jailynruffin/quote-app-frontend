import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { Circle } from 'lucide-react-native'
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth'
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { firebaseApp } from '../firebase/firebaseConfig'

export default function SignupScreen({ navigation }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = async () => {
    const auth = getAuth(firebaseApp)
    const db = getFirestore(firebaseApp)

    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please fill in all fields.')
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Add user to Firestore
      await setDoc(
        doc(db, 'users', user.uid),
        {
          email: user.email,
          username: username.trim(),
          profilePic: '',
          bio: '',
          createdAt: serverTimestamp(),
        },
        { merge: true }
      )

      // Attempt to send verification
      try {
        await sendEmailVerification(user)
      } catch (verificationError) {
        console.warn('Email verification failed:', verificationError.message)
      }

      await signOut(auth)

      Alert.alert(
        'Account created!',
        'Check your inbox to verify your email before logging in.'
      )
      navigation.navigate('Login')
    } catch (err) {
      Alert.alert('Signup failed', err.message)
    }
  }

  return (
    <View style={styles.container}>
      <Circle color="#e57cd8" size={70} style={{ marginBottom: 40 }} />
      <Text style={styles.header}>Sign Up</Text>

      <TextInput
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e57cd8',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#e57cd8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
})
