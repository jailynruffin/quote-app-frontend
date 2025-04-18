import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert
} from 'react-native'
import { Circle } from 'lucide-react-native'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { firebaseApp } from '../firebase/firebaseConfig'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    const auth = getAuth(firebaseApp)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (!user.emailVerified) {
        Alert.alert('Email not verified', 'Please verify your email before logging in.')
        await auth.signOut()
        return
      }

      Alert.alert('Success!', 'You’re now logged in.')
      navigation.navigate('Home')
    } catch (err) {
      Alert.alert('Login failed', err.message)
    }
  }

  return (
    <View style={styles.container}>
      <Circle color="#e57cd8" size={70} style={{ marginBottom: 40 }} />

      <Text style={styles.header}>Log In</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Don’t have an account? Sign up</Text>
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
