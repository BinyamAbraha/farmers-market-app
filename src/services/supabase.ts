// src/services/supabase.ts
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'
import Constants from 'expo-constants'

// Get credentials from app.json
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || ''
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anon key must be provided in app.json')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for your existing tables
export interface Market {
  id: string
  name: string
  latitude: number
  longitude: number
  address?: string
  hours?: any
  usda_id?: string
  phone?: string
  website?: string
  accepts_snap: boolean
  accepts_wic: boolean
  organic_only: boolean
  pet_friendly: boolean
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  market_id: string
  name: string
  specialty?: string
  contact_info?: any
  description?: string
  created_at: string
}

export interface MarketPhoto {
  id: string
  market_id: string
  user_id?: string
  photo_url: string
  tags?: string[]
  caption?: string
  likes_count: number
  created_at: string
}

export interface MarketReview {
  id: string
  market_id: string
  user_id?: string
  rating: number
  review_text?: string
  helpful_count: number
  created_at: string
}

export interface MarketPhoto {
  id: string
  market_id: string
  user_id?: string
  photo_url: string
  thumbnail_url?: string
  tags?: string[]
  caption?: string
  likes_count: number
  created_at: string
  updated_at: string
}

export interface PhotoLike {
  id: string
  photo_id: string
  user_id: string
  created_at: string
}

export interface PhotoReport {
  id: string
  photo_id: string
  user_id: string
  reason: 'inappropriate' | 'spam' | 'copyright' | 'other'
  description?: string
  created_at: string
}

// Service functions for your app
export const marketService = {
  // Get all markets
  async getAllMarkets(): Promise<Market[]> {
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .order('name')
    
    if (error) {
      console.error('Supabase error:', error)
      throw error
    }
    return data || []
  },

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('markets')
        .select('count')
        .limit(1)
      
      return !error
    } catch (error) {
      console.error('Connection test failed:', error)
      return false
    }
  }
}

// Photo management service
export const photoService = {
  // Create bucket if it doesn't exist
  async ensureBucketExists(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.warn('Error listing buckets:', listError)
        return // Continue anyway, bucket might exist
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === 'market-photos')
      
      if (!bucketExists) {
        console.log('Creating market-photos bucket...')
        const { error: createError } = await supabase.storage.createBucket('market-photos', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 10485760 // 10MB
        })
        
        if (createError) {
          console.warn('Bucket creation error (may already exist):', createError)
        } else {
          console.log('Successfully created market-photos bucket')
        }
      }
    } catch (error) {
      console.warn('Bucket check/creation error:', error)
      // Continue execution - bucket might exist but we can't verify
    }
  },

  // Upload photo to storage
  async uploadPhoto(
    uri: string, 
    marketId: string, 
    fileName?: string
  ): Promise<{ photoUrl: string; thumbnailUrl: string }> {
    try {
      // Ensure bucket exists before upload
      await this.ensureBucketExists()
      
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg'
      const timestamp = Date.now()
      const photoFileName = fileName || `${marketId}_${timestamp}.${fileExt}`
      
      // Create file blob from URI
      console.log('Fetching image from URI:', uri)
      const response = await fetch(uri)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      }
      
      const blob = await response.blob()
      console.log('Image blob size:', blob.size, 'bytes')
      
      // Upload original photo with retry logic
      let uploadAttempt = 0
      let photoData, photoError
      
      while (uploadAttempt < 3) {
        const result = await supabase.storage
          .from('market-photos')
          .upload(`photos/${photoFileName}`, blob, {
            contentType: `image/${fileExt}`,
            upsert: true // Allow overwrite for retry attempts
          })
        
        photoData = result.data
        photoError = result.error
        
        if (!photoError) break
        
        uploadAttempt++
        console.warn(`Upload attempt ${uploadAttempt} failed:`, photoError)
        
        // If bucket not found, try to create it
        if (photoError.message?.includes('Bucket not found') || photoError.message?.includes('404')) {
          console.log('Bucket not found, attempting to create...')
          await this.ensureBucketExists()
        }
        
        // Wait before retry
        if (uploadAttempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempt))
        }
      }
      
      if (photoError) {
        console.error('Final upload error after retries:', photoError)
        throw new Error(`Photo upload failed: ${photoError.message || 'Unknown error'}`)
      }
      
      console.log('Photo uploaded successfully:', photoData)
      
      // Get public URL for photo
      const { data: photoUrlData } = supabase.storage
        .from('market-photos')
        .getPublicUrl(`photos/${photoFileName}`)
      
      if (!photoUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded photo')
      }
      
      const photoUrl = photoUrlData.publicUrl
      const thumbnailUrl = photoUrl // Using same URL for now
      
      console.log('Generated photo URL:', photoUrl)
      
      return { photoUrl, thumbnailUrl }
    } catch (error) {
      console.error('Photo upload error:', error)
      throw new Error(`Photo upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  // Save photo metadata to database
  async savePhotoMetadata(photoData: Omit<MarketPhoto, 'id' | 'created_at' | 'updated_at' | 'likes_count'>): Promise<MarketPhoto> {
    try {
      const { data, error } = await supabase
        .from('market_photos')
        .insert({
          ...photoData,
          likes_count: 0
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Photo metadata save error:', error)
      throw error
    }
  },

  // Get photos for a market
  async getMarketPhotos(marketId: string): Promise<MarketPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('market_photos')
        .select('*')
        .eq('market_id', marketId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get market photos error:', error)
      throw error
    }
  },

  // Get all photos
  async getAllPhotos(limit = 50): Promise<MarketPhoto[]> {
    try {
      const { data, error } = await supabase
        .from('market_photos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get all photos error:', error)
      throw error
    }
  },

  // Like/unlike a photo
  async togglePhotoLike(photoId: string, userId: string): Promise<boolean> {
    try {
      // Check if like exists
      const { data: existingLike } = await supabase
        .from('photo_likes')
        .select('id')
        .eq('photo_id', photoId)
        .eq('user_id', userId)
        .single()
      
      if (existingLike) {
        // Remove like
        await supabase
          .from('photo_likes')
          .delete()
          .eq('photo_id', photoId)
          .eq('user_id', userId)
        
        // Decrement likes count
        await supabase.rpc('decrement_photo_likes', { photo_id: photoId })
        return false
      } else {
        // Add like
        await supabase
          .from('photo_likes')
          .insert({ photo_id: photoId, user_id: userId })
        
        // Increment likes count
        await supabase.rpc('increment_photo_likes', { photo_id: photoId })
        return true
      }
    } catch (error) {
      console.error('Toggle photo like error:', error)
      throw error
    }
  },

  // Report a photo
  async reportPhoto(
    photoId: string, 
    userId: string, 
    reason: PhotoReport['reason'], 
    description?: string
  ): Promise<void> {
    try {
      await supabase
        .from('photo_reports')
        .insert({
          photo_id: photoId,
          user_id: userId,
          reason,
          description
        })
    } catch (error) {
      console.error('Report photo error:', error)
      throw error
    }
  }
}