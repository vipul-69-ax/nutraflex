import { useCallback, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAX_TRANSLATE_Y = -SCREEN_HEIGHT / 1.5;

export const useBottomSheet = () => {
  const bottomSheetRef = useRef<Animated.Value>(new Animated.Value(0));

  const openBottomSheet = useCallback(() => {
    Animated.spring(bottomSheetRef.current, {
      toValue: MAX_TRANSLATE_Y,
      useNativeDriver: true,
    }).start();
  }, []);

  const closeBottomSheet = useCallback(() => {
    Animated.spring(bottomSheetRef.current, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  }, []);

  return {
    bottomSheetRef,
    openBottomSheet,
    closeBottomSheet,
  };
};

