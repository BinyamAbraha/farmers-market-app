// src/testSupabase.ts
import { marketService } from './services/supabase'

export const testSupabaseConnection = async () => {
  console.log('🔄 Testing Supabase connection...')
  
  try {
    const isConnected = await marketService.testConnection()
    console.log('✅ Connection successful:', isConnected)
    
    const markets = await marketService.getAllMarkets()
    console.log('📍 Markets found:', markets.length)
    if (markets.length > 0) {
      console.log('🏪 First market:', markets[0])
    } else {
      console.log('⚠️ No markets in database yet')
    }
    
    return true
  } catch (error) {
    console.error('❌ Connection failed:', error)
    return false
  }
}