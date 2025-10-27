import { FlatList } from 'react-native-gesture-handler';

export interface ScrollToIndexOptions {
  animated?: boolean;
  viewPosition?: number;
  fallbackOffset?: number;
}

export interface ScrollToIndexFailedInfo {
  index: number;
  highestMeasuredFrameIndex: number;
  averageItemLength: number;
}

/**
 * Safely scroll to a specific index in a FlatList with comprehensive error handling
 * @param flatListRef - Reference to the FlatList
 * @param index - Index to scroll to
 * @param dataLength - Length of the data array
 * @param options - Scroll options
 * @returns Promise<boolean> - Whether the scroll was successful
 */
export const safeScrollToIndex = async (
  flatListRef: React.RefObject<FlatList>,
  index: number,
  dataLength: number,
  options: ScrollToIndexOptions = {}
): Promise<boolean> => {
  const {
    animated = true,
    viewPosition = 0.5,
    fallbackOffset = 100
  } = options;

  // Validate inputs
  if (!flatListRef.current) {
    console.warn('FlatList ref not available');
    return false;
  }

  if (dataLength === 0) {
    console.warn('No data available for scrolling');
    return false;
  }

  if (index < 0 || index >= dataLength) {
    console.warn('Invalid scroll index:', index, 'Data length:', dataLength);
    return false;
  }

  try {
    await flatListRef.current.scrollToIndex({
      animated,
      index,
      viewPosition,
    });
    return true;
  } catch (error) {
    console.warn('scrollToIndex failed, using fallback:', error);
    
    try {
      const estimatedOffset = Math.max(0, index * fallbackOffset);
      await flatListRef.current.scrollToOffset({ 
        offset: estimatedOffset, 
        animated 
      });
      return true;
    } catch (fallbackError) {
      console.warn('scrollToOffset fallback also failed:', fallbackError);
      return false;
    }
  }
};

/**
 * Handle scrollToIndexFailed callback with enhanced error handling
 * @param flatListRef - Reference to the FlatList
 * @param info - Scroll failure information
 * @param fallbackOffset - Offset multiplier for fallback
 */
export const handleScrollToIndexFailed = (
  flatListRef: React.RefObject<FlatList>,
  info: ScrollToIndexFailedInfo,
  fallbackOffset: number = 100
): void => {
  console.warn('scrollToIndexFailed:', info);
  
  if (!flatListRef.current) {
    console.warn('FlatList ref not available in scrollToIndexFailed');
    return;
  }

  try {
    const offset = Math.max(0, info.averageItemLength * info.index);
    flatListRef.current.scrollToOffset({ offset, animated: true });
  } catch (error) {
    console.warn('scrollToOffset failed in handleScrollToIndexFailed:', error);
  }
};

/**
 * Create a safe scrollToIndex callback with retry mechanism
 * @param flatListRef - Reference to the FlatList
 * @param dataLength - Length of the data array
 * @param options - Scroll options
 * @returns Callback function for scrollToIndex
 */
export const createSafeScrollToIndexCallback = (
  flatListRef: React.RefObject<FlatList>,
  dataLength: number,
  options: ScrollToIndexOptions = {}
) => {
  return async (index: number): Promise<boolean> => {
    return safeScrollToIndex(flatListRef, index, dataLength, options);
  };
};

/**
 * Create a safe scrollToIndexFailed callback
 * @param flatListRef - Reference to the FlatList
 * @param fallbackOffset - Offset multiplier for fallback
 * @returns Callback function for scrollToIndexFailed
 */
export const createSafeScrollToIndexFailedCallback = (
  flatListRef: React.RefObject<FlatList>,
  fallbackOffset: number = 100
) => {
  return (info: ScrollToIndexFailedInfo): void => {
    handleScrollToIndexFailed(flatListRef, info, fallbackOffset);
  };
};
