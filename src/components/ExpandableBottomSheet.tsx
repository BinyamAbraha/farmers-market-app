import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { height: screenHeight } = Dimensions.get('window');

interface ExpandableBottomSheetProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
  minHeight?: number;
  maxHeight?: number;
}

const ExpandableBottomSheet: React.FC<ExpandableBottomSheetProps> = ({
  children,
  title,
  subtitle,
  isExpanded,
  onToggle,
  minHeight = 120,
  maxHeight = screenHeight * 0.6,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastGestureDy = useRef(0);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isExpanded ? -(maxHeight - minHeight) : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [isExpanded, maxHeight, minHeight]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onPanResponderGrant: () => {
      translateY.setOffset(lastGestureDy.current);
      translateY.setValue(0);
    },
    onPanResponderMove: (_, gestureState) => {
      translateY.setValue(gestureState.dy);
    },
    onPanResponderRelease: (_, gestureState) => {
      translateY.flattenOffset();
      lastGestureDy.current += gestureState.dy;

      if (gestureState.dy < -50) {
        // Swipe up - expand
        onToggle(true);
        lastGestureDy.current = -(maxHeight - minHeight);
      } else if (gestureState.dy > 50) {
        // Swipe down - collapse
        onToggle(false);
        lastGestureDy.current = 0;
      } else {
        // Snap back to current state
        Animated.spring(translateY, {
          toValue: isExpanded ? -(maxHeight - minHeight) : 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
        lastGestureDy.current = isExpanded ? -(maxHeight - minHeight) : 0;
      }
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: maxHeight,
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Handle Bar */}
      <View style={styles.handleContainer} {...panResponder.panHandlers}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle}>{subtitle}</Text>
          )}
        </View>
        <Ionicons
          name={isExpanded ? "chevron-down" : "chevron-up"}
          size={20}
          color="#666"
          style={styles.chevron}
        />
      </View>

      {/* Content - Direct render without ScrollView to avoid nesting */}
      <View style={styles.content}>
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  chevron: {
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
});

export default ExpandableBottomSheet;