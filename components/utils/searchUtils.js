// utils/searchUtils.js

export const createSearchKeywords = (name = '', username = '') => {
    const keywords = new Set();
  
    const tokenize = (str) => {
      const parts = str.toLowerCase().split(/\s+/);
      parts.forEach(part => {
        for (let i = 1; i <= part.length; i++) {
          keywords.add(part.slice(0, i));
        }
      });
    };
  
    tokenize(name);
    tokenize(username);
    keywords.add(username.toLowerCase());
  
    return Array.from(keywords);
  };
  