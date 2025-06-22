import { useState, useEffect, useCallback } from 'react';
import { vendorService } from '../services/supabase';
import * as Haptics from 'expo-haptics';

interface UseVendorFollowResult {
  isFollowing: (vendorId: string) => boolean;
  followVendor: (vendorId: string) => Promise<void>;
  unfollowVendor: (vendorId: string) => Promise<void>;
  toggleFollow: (vendorId: string) => Promise<void>;
  isLoading: (vendorId: string) => boolean;
  followCounts: Record<string, number>;
}

// Temporary user ID for development
const TEMP_USER_ID = 'temp-user-123';

export const useVendorFollow = (): UseVendorFollowResult => {
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());
  const [followCounts, setFollowCounts] = useState<Record<string, number>>({});

  // Initialize follow states from sample data
  useEffect(() => {
    // In a real app, this would load from the user's following list
    // For demo purposes, start with some vendors followed
    setFollowingSet(new Set(['vendor-1', 'vendor-3']));
    
    // Initialize follow counts from sample vendors
    const sampleVendors = vendorService.getSampleVendors();
    const counts: Record<string, number> = {};
    sampleVendors.forEach(vendor => {
      counts[vendor.id] = vendor.follower_count;
    });
    setFollowCounts(counts);
  }, []);

  const isFollowing = useCallback((vendorId: string): boolean => {
    return followingSet.has(vendorId);
  }, [followingSet]);

  const isLoading = useCallback((vendorId: string): boolean => {
    return loadingSet.has(vendorId);
  }, [loadingSet]);

  const followVendor = useCallback(async (vendorId: string): Promise<void> => {
    if (loadingSet.has(vendorId) || followingSet.has(vendorId)) return;

    try {
      setLoadingSet(prev => new Set(prev).add(vendorId));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Optimistic update
      setFollowingSet(prev => new Set(prev).add(vendorId));
      setFollowCounts(prev => ({
        ...prev,
        [vendorId]: (prev[vendorId] || 0) + 1
      }));

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In production, this would call the actual API
      // await vendorService.toggleVendorFollow(vendorId, TEMP_USER_ID);
      
    } catch (error) {
      console.error('Follow vendor error:', error);
      
      // Rollback optimistic update on error
      setFollowingSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
      setFollowCounts(prev => ({
        ...prev,
        [vendorId]: Math.max((prev[vendorId] || 0) - 1, 0)
      }));
      
      throw error;
    } finally {
      setLoadingSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    }
  }, [loadingSet, followingSet]);

  const unfollowVendor = useCallback(async (vendorId: string): Promise<void> => {
    if (loadingSet.has(vendorId) || !followingSet.has(vendorId)) return;

    try {
      setLoadingSet(prev => new Set(prev).add(vendorId));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update
      setFollowingSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
      setFollowCounts(prev => ({
        ...prev,
        [vendorId]: Math.max((prev[vendorId] || 0) - 1, 0)
      }));

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // In production, this would call the actual API
      // await vendorService.toggleVendorFollow(vendorId, TEMP_USER_ID);
      
    } catch (error) {
      console.error('Unfollow vendor error:', error);
      
      // Rollback optimistic update on error
      setFollowingSet(prev => new Set(prev).add(vendorId));
      setFollowCounts(prev => ({
        ...prev,
        [vendorId]: (prev[vendorId] || 0) + 1
      }));
      
      throw error;
    } finally {
      setLoadingSet(prev => {
        const newSet = new Set(prev);
        newSet.delete(vendorId);
        return newSet;
      });
    }
  }, [loadingSet, followingSet]);

  const toggleFollow = useCallback(async (vendorId: string): Promise<void> => {
    if (isFollowing(vendorId)) {
      await unfollowVendor(vendorId);
    } else {
      await followVendor(vendorId);
    }
  }, [isFollowing, followVendor, unfollowVendor]);

  return {
    isFollowing,
    followVendor,
    unfollowVendor,
    toggleFollow,
    isLoading,
    followCounts
  };
};