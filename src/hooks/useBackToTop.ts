import { useCallback, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewInstance,
} from "react-native";

export function useBackToTop(threshold = 400) {
  const scrollRef = useRef<ScrollViewInstance>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setShowBackToTop(e.nativeEvent.contentOffset.y > threshold);
    },
    [threshold],
  );

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  return { scrollRef, showBackToTop, handleScroll, scrollToTop };
}