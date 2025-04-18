// auth/LoginScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Circle } from 'lucide-react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseApp } from '../firebase/firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // create a profile document if it doesn’t exist yet
  const ensureProfile = async (user) => {
    const db  = getFirestore(firebaseApp);
    const ref = doc(db, 'users', user.uid);

    if (!(await getDoc(ref)).exists()) {
      await setDoc(ref, {
        email: user.email,
        username: user.displayName ?? user.email.split('@')[0],
        profilePic: null,
        bio: '',
        createdAt: serverTimestamp(),
      });
    }
  };

  const handleLogin = async () => {
    try {
      const auth = getAuth(firebaseApp);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await ensureProfile(cred.user);

      navigation.replace('AppTabs');   // or whatever your main navigator is
    } catch (err) {
      Alert.alert('Login failed', err.message);
    }
  };

  /* ───────────── UI ───────────── */
  return (
    <View style={styles.container}>
      <Circle color="#e57cd8" size={70} style={{ marginBottom: 40 }} />
      <Text style={styles.header}>Log In</Text>

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
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.link}>Need an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
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
