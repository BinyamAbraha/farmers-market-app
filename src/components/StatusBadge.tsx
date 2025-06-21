import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type MarketStatus = 'open' | 'closed' | 'closing-soon';

interface StatusBadgeProps {
  status: MarketStatus;
  timeRemaining?: string;
  size?: 'small' | 'medium' | 'large';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  timeRemaining, 
  size = 'medium' 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'open':
        return {
          backgroundColor: '#4CAF50',
          dotColor: '#81C784',
          text: 'Open',
          emoji: '🟢'
        };
      case 'closing-soon':
        return {
          backgroundColor: '#FF9800',
          dotColor: '#FFB74D',
          text: 'Closing Soon',
          emoji: '🟡'
        };
      case 'closed':
        return {
          backgroundColor: '#F44336',
          dotColor: '#EF5350',
          text: 'Closed',
          emoji: '🔴'
        };
      default:
        return {
          backgroundColor: '#9E9E9E',
          dotColor: '#BDBDBD',
          text: 'Unknown',
          emoji: '⚪'
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = getSizeStyles(size);

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }, sizeStyles.badge]}>
      <View style={[
        styles.statusDot, 
        { backgroundColor: config.dotColor },
        sizeStyles.dot
      ]} />
      <Text style={[styles.statusText, sizeStyles.text]}>
        {config.text}
      </Text>
      {timeRemaining && (
        <Text style={[styles.timeText, sizeStyles.timeText]}>
          {timeRemaining}
        </Text>
      )}
    </View>
  );
};

const getSizeStyles = (size: 'small' | 'medium' | 'large') => {
  switch (size) {
    case 'small':
      return StyleSheet.create({
        badge: {
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 8,
        },
        dot: {
          width: 4,
          height: 4,
          borderRadius: 2,
          marginRight: 3,
        },
        text: {
          fontSize: 10,
          fontWeight: '500',
        },
        timeText: {
          fontSize: 8,
          marginLeft: 3,
        },
      });
    case 'large':
      return StyleSheet.create({
        badge: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 16,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 4,
          marginRight: 6,
        },
        text: {
          fontSize: 14,
          fontWeight: '600',
        },
        timeText: {
          fontSize: 12,
          marginLeft: 6,
        },
      });
    default: // medium
      return StyleSheet.create({
        badge: {
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        },
        dot: {
          width: 6,
          height: 6,
          borderRadius: 3,
          marginRight: 4,
        },
        text: {
          fontSize: 12,
          fontWeight: '500',
        },
        timeText: {
          fontSize: 10,
          marginLeft: 4,
        },
      });
  }
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  statusDot: {},
  statusText: {
    color: '#fff',
  },
  timeText: {
    color: '#fff',
    opacity: 0.9,
  },
});

export default StatusBadge;