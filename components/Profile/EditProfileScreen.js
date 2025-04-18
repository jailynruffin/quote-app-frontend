import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native'
import { getAuth } from 'firebase/auth'
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import * as ImagePicker from 'expo-image-picker'
import { firebaseApp } from '../firebase/firebaseConfig'
import * as uuid from 'uuid'

export default function EditProfileScreen({ navigation }) {
  const [username, setUsername] = useState('')
  const [profilePic, setProfilePic] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth(firebaseApp)
      const db = getFirestore(firebaseApp)
      const user = auth.currentUser

      if (user) {
        const userRef = doc(db, 'users', user.uid)
        const docSnap = await getDoc(userRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setUsername(data.username || '')
          setProfilePic(data.profilePic || '')
        }

        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    })

    if (!result.canceled) {
      const imageUri = result.assets[0].uri
      await uploadImageToFirebase(imageUri)
    }
  }

  const uploadImageToFirebase = async (uri) => {
    try {
      setUploading(true)

      const auth = getAuth(firebaseApp)
      const storage = getStorage(firebaseApp)
      const db = getFirestore(firebaseApp)
      const user = auth.currentUser

      const response = await fetch(uri)
      const blob = await response.blob()

      const filename = `profilePics/${user.uid}_${uuid.v4()}.jpg`
      const imageRef = ref(storage, filename)

      await uploadBytes(imageRef, blob)
      const downloadURL = await getDownloadURL(imageRef)

      setProfilePic(downloadURL)

      // Save to Firestore
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, { profilePic: downloadURL })

      Alert.alert('Success', 'Profile picture updated!')
    } catch (err) {
      Alert.alert('Upload failed', err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Invalid Username', 'Please enter a valid username.')
      return
    }

    try {
      const auth = getAuth(firebaseApp)
      const db = getFirestore(firebaseApp)
      const user = auth.currentUser
      const userRef = doc(db, 'users', user.uid)

      await updateDoc(userRef, { username: username.trim() })

      Alert.alert('Success', 'Profile updated!')
      navigation.goBack()
    } catch (err) {
      Alert.alert('Error', err.message)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e57cd8" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Edit Profile</Text>

      <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
        {profilePic ? (
          <Image source={{ uri: profilePic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
        <Text style={styles.editPicText}>Tap to change photo</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveText}>
          {uploading ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: '#e57cd8',
    marginBottom: 20,
    alignSelf: 'center',
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
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
  editPicText: {
    color: '#888',
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#e57cd8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})


