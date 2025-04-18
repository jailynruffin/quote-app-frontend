import React from 'react'
import { View, TouchableOpacity, StyleSheet } from 'react-native'
import { BlurView } from 'expo-blur'
import {
  Home,
  BookOpen,
  Users,
  User,
  Circle,
} from 'lucide-react-native'

export default function CustomTabBar({ state, navigation }) {
  const icons = {
    Home: Home,
    MyQuotes: BookOpen,
    Add: Circle,
    Groups: Users,
    Profile: User,
  }



  return (
    <BlurView intensity={60} tint="light" style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index
        const onPress = () => navigation.navigate(route.name)
        const Icon = icons[route.name]
        if (!Icon) return null 
        const isCenter = route.name === 'Add'
        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={isCenter ? styles.centerTab : styles.tab}
            activeOpacity={0.8}
          >
            <View style={styles.iconWrapper}>
              {isFocused && <View style={styles.glow} />}
              <Icon
                size={28}
                strokeWidth={2}
                color={isFocused ? '#e57cd8' : '#bbb'}
              />
              {isFocused && <View style={styles.dot} />}
            </View>
          </TouchableOpacity>
        )
      })}
    </BlurView>
  )
}

const styles = StyleSheet.create({
    tabBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      position: 'absolute',
      bottom: 0,
      width: '100%',
      paddingTop: 12,
      paddingBottom: 22,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
      shadowColor: '#e57cd8',
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 20,
      backgroundColor: 'transparent',
    },
    tab: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerTab: {
      alignItems: 'center',
      justifyContent: 'center',
      // Optional: style like others OR float it if you want to
      // If you want a floating effect again, uncomment below:
      // backgroundColor: '#fce7f4',
      // width: 54,
      // height: 54,
      // borderRadius: 27,
      // marginTop: -18,
      // shadowColor: '#e57cd8',
      // shadowOpacity: 0.25,
      // shadowRadius: 8,
      // elevation: 6,
    },
    iconWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    glow: {
      position: 'absolute',
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#f5d1ef',
      opacity: 0.45,
      zIndex: -1,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#e57cd8',
      marginTop: 4,
    },
  })
  