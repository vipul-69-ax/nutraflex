import { useCallback, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';

export const useKeyboardAwareBottomSheet = () => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [bottomSheetIndex, setBottomSheetIndex] = useState(-1);

  const handleSheetChanges = useCallback((index: number) => {
    setBottomSheetIndex(index);
  }, []);

  const handleInputFocus = useCallback(() => {
    if (Platform.OS === 'ios') {
      bottomSheetRef.current?.snapToIndex(2);
    }
  }, []);

  const handleInputBlur = useCallback(() => {
    if (Platform.OS === 'ios') {
      bottomSheetRef.current?.snapToIndex(1);
    }
  }, []);

  const openBottomSheet = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  return {
    bottomSheetRef,
    bottomSheetIndex,
    handleSheetChanges,
    handleInputFocus,
    handleInputBlur,
    openBottomSheet,
    closeBottomSheet,
  };
};
