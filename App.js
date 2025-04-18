// App.js
import React from 'react'
import { QuoteProvider } from './components/context/QuoteContext'
import RootNavigator from './components/Navigation/RootNavigator'

export default function App() {
  return (
    <QuoteProvider>
      <RootNavigator />
    </QuoteProvider>
  )
}
