// components/Navigation/MainStack.js
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AppTabs from './AppTabs'
import EditProfileScreen from '../Profile/EditProfileScreen'

const Stack = createNativeStackNavigator()

export default function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    </Stack.Navigator>
  )
}
