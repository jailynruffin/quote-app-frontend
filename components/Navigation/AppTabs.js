import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import HomePageScreen from '../HomePage/HomePageScreen'
import AddQuoteScreen from '../AddQuotes/AddQuoteScreen'
import ProfileScreen from '../Profile/ProfileScreen'
import CustomTabBar from './CustomTabBar'
import EditProfileScreen from '../Profile/EditProfileScreen.js'

const Placeholder = () => null

const Tab = createBottomTabNavigator()

export default function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomePageScreen} />
      <Tab.Screen name="MyQuotes" component={Placeholder} />
      <Tab.Screen name="Add" component={AddQuoteScreen} />
      <Tab.Screen name="Groups" component={Placeholder} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
