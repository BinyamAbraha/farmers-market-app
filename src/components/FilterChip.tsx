import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FilterOption {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  count?: number;
}

interface FilterChipProps {
  filter: FilterOption;
  isSelected: boolean;
  onPress: (key: string) => void;
  variant?: 'default' | 'outline' | 'compact';
}

const FilterChip: React.FC<FilterChipProps> = ({
  filter,
  isSelected,
  onPress,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'outline':
        return {
          chip: [
            styles.chip,
            styles.outlineChip,
            isSelected && styles.outlineChipSelected,
          ],
          text: [
            styles.text,
            styles.outlineText,
            isSelected && styles.outlineTextSelected,
          ],
          icon: isSelected ? '#fff' : '#2E8B57',
        };
      case 'compact':
        return {
          chip: [
            styles.chip,
            styles.compactChip,
            isSelected && styles.chipSelected,
          ],
          text: [
            styles.text,
            styles.compactText,
            isSelected && styles.textSelected,
          ],
          icon: isSelected ? '#fff' : '#2E8B57',
        };
      default:
        return {
          chip: [
            styles.chip,
            isSelected && styles.chipSelected,
          ],
          text: [
            styles.text,
            isSelected && styles.textSelected,
          ],
          icon: isSelected ? '#fff' : '#2E8B57',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <TouchableOpacity
      style={variantStyles.chip}
      onPress={() => onPress(filter.key)}
      activeOpacity={0.7}
    >
      <View style={styles.chipContent}>
        {filter.icon && (
          <Ionicons
            name={filter.icon}
            size={16}
            color={variantStyles.icon}
            style={styles.icon}
          />
        )}
        <Text style={variantStyles.text}>
          {filter.label}
        </Text>
        {filter.count !== undefined && filter.count > 0 && (
          <View style={[
            styles.countBadge,
            isSelected && styles.countBadgeSelected
          ]}>
            <Text style={[
              styles.countText,
              isSelected && styles.countTextSelected
            ]}>
              {filter.count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chipSelected: {
    backgroundColor: '#2E8B57',
    borderColor: '#2E8B57',
  },
  outlineChip: {
    backgroundColor: 'transparent',
    borderColor: '#2E8B57',
    borderWidth: 1.5,
  },
  outlineChipSelected: {
    backgroundColor: '#2E8B57',
  },
  compactChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chipContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  textSelected: {
    color: '#fff',
  },
  outlineText: {
    color: '#2E8B57',
  },
  outlineTextSelected: {
    color: '#fff',
  },
  compactText: {
    fontSize: 12,
  },
  countBadge: {
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  countTextSelected: {
    color: '#fff',
  },
});

export default FilterChip;