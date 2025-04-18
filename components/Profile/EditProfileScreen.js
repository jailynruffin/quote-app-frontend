import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { firebaseApp } from '../firebase/firebaseConfig';
import * as uuid from 'uuid';
import { ArrowLeft } from 'lucide-react-native';
import { createSearchKeywords } from '../utils/searchUtils';

export default function EditProfileScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialUsername, setInitialUsername] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const auth = getAuth(firebaseApp);
      const db = getFirestore(firebaseApp);
      const user = auth.currentUser;

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUsername(data.username || '');
          setInitialUsername(data.username || '');
          setProfilePic(data.profilePic || '');
          setBio(data.bio || '');
        }

        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      await uploadImageToFirebase(imageUri);
    }
  };

  const uploadImageToFirebase = async (uri) => {
    try {
      setUploading(true);

      const auth = getAuth(firebaseApp);
      const storage = getStorage(firebaseApp);
      const db = getFirestore(firebaseApp);
      const user = auth.currentUser;

      const response = await fetch(uri);
      const blob = await response.blob();

      const filename = `profilePics/${user.uid}_${uuid.v4()}.jpg`;
      const imageRef = ref(storage, filename);

      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);

      setProfilePic(downloadURL);

      // Save to Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { profilePic: downloadURL });

      Alert.alert('Success', 'Profile picture updated!');
    } catch (err) {
      Alert.alert('Upload failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const auth = getAuth(firebaseApp);
    const db = getFirestore(firebaseApp);
    const user = auth.currentUser;

    if (!username.trim()) {
      Alert.alert('Invalid Username', 'Please enter a valid username.');
      return;
    }

    const trimmed = username.trim();

    // Check if username already exists (and isn't your own)
    if (trimmed !== initialUsername) {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', trimmed));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        Alert.alert('Username Taken', 'Please choose a different username.');
        return;
      }
    }

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        username: trimmed,
        bio: bio.trim(),
        searchKeywords: createSearchKeywords(trimmed, trimmed),
      });      

      Alert.alert('Success', 'Profile updated!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e57cd8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <ArrowLeft size={22} color="#e57cd8" />
      </TouchableOpacity>

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

      <TextInput
        placeholder="Bio"
        placeholderTextColor="#aaa"
        value={bio}
        onChangeText={setBio}
        style={[styles.input, styles.bioInput]}
        multiline
        maxLength={120}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={uploading}>
        {uploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.saveText}>Save Changes</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 8,
    zIndex: 10,
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
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#e57cd8',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    elevation: 3,
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
