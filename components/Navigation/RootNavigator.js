import React, { useEffect, useState } from 'react'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { NavigationContainer } from '@react-navigation/native'
import { firebaseApp } from '../firebase/firebaseConfig'
import AuthStack from './AuthStack'
import MainStack from './MainStack'
import { View, ActivityIndicator } from 'react-native'


export default function RootNavigator() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth(firebaseApp)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e57cd8" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {user && user.emailVerified ? <MainStack /> : <AuthStack />}
    </NavigationContainer>
  )
}
