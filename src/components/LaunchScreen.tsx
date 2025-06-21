import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { testSupabaseConnection } from '../testSupabase';

const { width, height } = Dimensions.get('window');

interface LaunchScreenProps {
  onAnimationComplete: () => void;
}

const LaunchScreen: React.FC<LaunchScreenProps> = ({ onAnimationComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScaleAnim = useRef(new Animated.Value(0.8)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const text2OpacityAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;

  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [currentText, setCurrentText] = useState('Farmers Market');
  const [showSecondText, setShowSecondText] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReducedMotion);
  }, []);

  useEffect(() => {
    startAnimation();
  }, [isReducedMotion]);

  const startAnimation = () => {
    if (isReducedMotion) {
      // Skip animations for accessibility
      setTimeout(() => {
        preloadAssets();
        setTimeout(onAnimationComplete, 1000);
      }, 500);
      return;
    }

    // Start preloading assets
    preloadAssets();

    // Initial fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Logo zoom animation
    Animated.timing(logoScaleAnim, {
      toValue: 1.0,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // First text animation
    setTimeout(() => {
      Animated.timing(textOpacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 200);

    // Text transition animation
    setTimeout(() => {
      Animated.timing(textOpacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setCurrentText('Discover Local');
        setShowSecondText(true);
        Animated.timing(text2OpacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 1000);

    // Loading dots animation
    setTimeout(() => {
      startLoadingAnimation();
    }, 1500);

    // Exit animation
    setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete();
      });
    }, 2800);
  };

  const startLoadingAnimation = () => {
    const animateDot = (dotAnim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dotAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dotAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateDot(dot1Anim, 0);
    animateDot(dot2Anim, 200);
    animateDot(dot3Anim, 400);
  };

  const preloadAssets = async () => {
    try {
      // Test Supabase connection during loading
      await testSupabaseConnection();
      
      // Preload any critical assets here
      // This is where you would load fonts, images, or other resources
      
    } catch (error) {
      console.error('Error preloading assets:', error);
    }
  };

  const dotTransform = (anim: Animated.Value) => ({
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        }),
      },
    ],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: exitAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={['#2E8B57', '#90EE90']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: logoScaleAnim }],
              },
            ]}
          >
            <Ionicons
              name="storefront"
              size={80}
              color="#FFFFFF"
              style={styles.logo}
            />
          </Animated.View>

          {/* Text Animation */}
          <View style={styles.textContainer}>
            {!showSecondText ? (
              <Animated.Text
                style={[
                  styles.titleText,
                  {
                    opacity: textOpacityAnim,
                  },
                ]}
              >
                {currentText}
              </Animated.Text>
            ) : (
              <Animated.Text
                style={[
                  styles.titleText,
                  {
                    opacity: text2OpacityAnim,
                  },
                ]}
              >
                {currentText}
              </Animated.Text>
            )}
          </View>

          {/* Loading Dots */}
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.dot,
                dotTransform(dot1Anim),
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                dotTransform(dot2Anim),
              ]}
            />
            <Animated.View
              style={[
                styles.dot,
                dotTransform(dot3Anim),
              ]}
            />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  textContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    position: 'absolute',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
  },
});

export default LaunchScreen;