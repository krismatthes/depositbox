// Debug script to check localStorage data
console.log('LocalStorage contents:')
console.log('Keys:', Object.keys(localStorage))

// Find all keys related to escrows
const escrowKeys = Object.keys(localStorage).filter(key => key.includes('escrows_'))
console.log('Escrow keys:', escrowKeys)

escrowKeys.forEach(key => {
  const data = localStorage.getItem(key)
  console.log(`${key}:`, JSON.parse(data || '[]'))
})

// Show all keys with data
Object.keys(localStorage).forEach(key => {
  const value = localStorage.getItem(key)
  console.log(`${key}: ${value.length > 100 ? value.substring(0, 100) + '...' : value}`)
})