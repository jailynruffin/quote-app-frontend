import React, { createContext, useState } from 'react'

export const QuoteContext = createContext()

export const QuoteProvider = ({ children }) => {
  const [quotes, setQuotes] = useState([])

  const addQuote = (text) => {
    const newQuote = {
      id: Date.now(),
      text,
      author: '@you',
      time: 'Just now',
    }
    setQuotes((prev) => [newQuote, ...prev])
  }

  return (
    <QuoteContext.Provider value={{ quotes, addQuote }}>
      {children}
    </QuoteContext.Provider>
  )
}
