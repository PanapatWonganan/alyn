import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../../theme';

interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  onSubmit,
  placeholder = 'ค้นหานิยาย...',
  style,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [searchText, setSearchText] = useState(value || '');
  const widthAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (value !== undefined) {
      setSearchText(value);
    }
  }, [value]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    Animated.spring(widthAnim, {
      toValue: 1,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    if (!searchText) {
      setIsFocused(false);
      onBlur?.();
    }
  };

  const handleCancel = () => {
    setSearchText('');
    onChangeText?.('');
    setIsFocused(false);
    onBlur?.();
  };

  const handleChangeText = (text: string) => {
    setSearchText(text);
    onChangeText?.(text);
  };

  const handleSubmit = () => {
    onSubmit?.(searchText);
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.searchContainer,
          isFocused && styles.searchContainerFocused,
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={isFocused ? colors.primary.DEFAULT : colors.text.secondary}
          style={styles.searchIcon}
        />
        <TextInput
          value={searchText}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.input.placeholder}
          returnKeyType="search"
          style={styles.input}
        />
        {searchText.length > 0 && (
          <Pressable onPress={handleCancel} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.text.secondary}
            />
          </Pressable>
        )}
      </Animated.View>
      {isFocused && (
        <Pressable onPress={handleCancel} style={styles.cancelButton}>
          <Ionicons
            name="close"
            size={20}
            color={colors.primary.DEFAULT}
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary.DEFAULT,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  searchContainerFocused: {
    backgroundColor: colors.brand.white,
    borderColor: colors.primary.DEFAULT,
    ...shadows.sm,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base.size,
    lineHeight: typography.fontSize.base.lineHeight,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs / 2,
  },
  cancelButton: {
    marginLeft: spacing.md,
    padding: spacing.xs,
  },
});
