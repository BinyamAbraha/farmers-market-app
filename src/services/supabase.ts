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
  // Enhanced social features
  cover_photo_url?: string
  profile_photo_url?: string
  bio?: string
  follower_count: number
  instagram_handle?: string
  specialties: string[]
  featured_products: string[]
  operating_hours?: any
  market_locations: string[]
  verified: boolean
  rating: number
  review_count: number
  phone?: string
  website?: string
  updated_at: string
}

export interface VendorFollower {
  id: string
  user_id: string
  vendor_id: string
  followed_at: string
}

export interface VendorPost {
  id: string
  vendor_id: string
  content_type: 'photo' | 'story' | 'update'
  image_url?: string
  caption?: string
  hashtags: string[]
  likes_count: number
  created_at: string
  updated_at: string
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

// Vendor service functions
export const vendorService = {
  // Get all vendors with enhanced data
  async getAllVendors(): Promise<Vendor[]> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('follower_count', { ascending: false })
    
    if (error) {
      console.error('Vendor fetch error:', error)
      throw error
    }
    return data || []
  },

  // Get vendor by ID
  async getVendorById(vendorId: string): Promise<Vendor | null> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single()
    
    if (error) {
      console.error('Vendor fetch error:', error)
      return null
    }
    return data
  },

  // Get trending vendors (based on recent follower growth)
  async getTrendingVendors(limit = 10): Promise<Vendor[]> {
    const { data, error } = await supabase
      .from('vendors')
      .select('*')
      .order('follower_count', { ascending: false })
      .limit(limit)
    
    if (error) {
      console.error('Trending vendors error:', error)
      throw error
    }
    return data || []
  },

  // Get vendors near location
  async getVendorsNearLocation(latitude: number, longitude: number, radiusMiles = 25): Promise<Vendor[]> {
    // This would use a proper geospatial query in production
    // For now, return all vendors
    return this.getAllVendors()
  },

  // Follow/unfollow vendor
  async toggleVendorFollow(vendorId: string, userId: string): Promise<boolean> {
    try {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('vendor_followers')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('user_id', userId)
        .single()

      if (existingFollow) {
        // Unfollow
        await supabase
          .from('vendor_followers')
          .delete()
          .eq('vendor_id', vendorId)
          .eq('user_id', userId)

        // Decrement follower count
        await supabase.rpc('decrement_vendor_followers', { vendor_id: vendorId })
        return false
      } else {
        // Follow
        await supabase
          .from('vendor_followers')
          .insert({ vendor_id: vendorId, user_id: userId })

        // Increment follower count
        await supabase.rpc('increment_vendor_followers', { vendor_id: vendorId })
        return true
      }
    } catch (error) {
      console.error('Toggle vendor follow error:', error)
      throw error
    }
  },

  // Check if user follows vendor
  async isFollowingVendor(vendorId: string, userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('vendor_followers')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('user_id', userId)
        .single()

      return !!data
    } catch (error) {
      return false
    }
  },

  // Get vendor posts
  async getVendorPosts(vendorId: string, limit = 20): Promise<VendorPost[]> {
    const { data, error } = await supabase
      .from('vendor_posts')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Vendor posts error:', error)
      throw error
    }
    return data || []
  },

  // Create vendor post
  async createVendorPost(postData: Omit<VendorPost, 'id' | 'created_at' | 'updated_at' | 'likes_count'>): Promise<VendorPost> {
    const { data, error } = await supabase
      .from('vendor_posts')
      .insert({
        ...postData,
        likes_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Create vendor post error:', error)
      throw error
    }
    return data
  },

  // Get sample vendor data for development
  getSampleVendors(): Vendor[] {
    return [
      {
        id: 'vendor-1',
        market_id: 'market-1',
        name: 'Green Valley Farm',
        specialty: 'Organic Vegetables',
        description: 'Family-owned organic farm since 1985',
        created_at: '2024-01-01T00:00:00Z',
        cover_photo_url: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=400&fit=crop',
        profile_photo_url: 'https://images.unsplash.com/photo-1595855759920-86582396756a?w=200&h=200&fit=crop&crop=face',
        bio: 'Passionate about growing the freshest organic vegetables using sustainable farming practices. Visit us at Ferry Building every Saturday!',
        follower_count: 1250,
        instagram_handle: '@greenvalleyfarm',
        specialties: ['Organic Vegetables', 'Heirloom Tomatoes', 'Leafy Greens'],
        featured_products: ['Heirloom Tomatoes', 'Baby Spinach', 'Rainbow Carrots'],
        operating_hours: { saturday: '8:00 AM - 2:00 PM', sunday: '9:00 AM - 1:00 PM' },
        market_locations: ['Ferry Building Farmers Market', 'Palo Alto Farmers Market'],
        verified: true,
        rating: 4.9,
        review_count: 127,
        phone: '(555) 123-4567',
        website: 'https://greenvalleyfarm.com',
        updated_at: '2024-06-22T00:00:00Z'
      },
      {
        id: 'vendor-2',
        market_id: 'market-2',
        name: 'Sunrise Orchards',
        specialty: 'Fresh Fruits',
        description: 'Premium stone fruits and berries',
        created_at: '2024-01-15T00:00:00Z',
        cover_photo_url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
        profile_photo_url: 'https://images.unsplash.com/photo-1607532941433-304659e8198a?w=200&h=200&fit=crop&crop=face',
        bio: 'Third-generation fruit growers specializing in the sweetest peaches, plums, and berries in the Bay Area.',
        follower_count: 890,
        instagram_handle: '@sunriseorchards',
        specialties: ['Stone Fruits', 'Berries', 'Seasonal Fruits'],
        featured_products: ['White Peaches', 'Organic Strawberries', 'Fuji Apples'],
        operating_hours: { saturday: '7:00 AM - 3:00 PM', sunday: '8:00 AM - 2:00 PM' },
        market_locations: ['Berkeley Farmers Market', 'Alameda Farmers Market'],
        verified: true,
        rating: 4.8,
        review_count: 89,
        phone: '(555) 987-6543',
        website: '',
        updated_at: '2024-06-22T00:00:00Z'
      },
      {
        id: 'vendor-3',
        market_id: 'market-3',
        name: 'Artisan Breads Co',
        specialty: 'Baked Goods',
        description: 'Traditional European-style breads and pastries',
        created_at: '2024-02-01T00:00:00Z',
        cover_photo_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=400&fit=crop',
        profile_photo_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=face',
        bio: 'Master bakers creating authentic sourdough and artisan breads using traditional methods and local grains.',
        follower_count: 2100,
        instagram_handle: '@artisanbreadsco',
        specialties: ['Sourdough', 'Artisan Breads', 'Pastries'],
        featured_products: ['Wild Sourdough', 'Croissants', 'Focaccia'],
        operating_hours: { friday: '6:00 AM - 1:00 PM', saturday: '6:00 AM - 2:00 PM', sunday: '7:00 AM - 1:00 PM' },
        market_locations: ['Ferry Building Farmers Market', 'Marin Farmers Market'],
        verified: true,
        rating: 4.7,
        review_count: 203,
        phone: '(555) 456-7890',
        website: 'https://artisanbreadsco.com',
        updated_at: '2024-06-22T00:00:00Z'
      }
    ]
  }
}