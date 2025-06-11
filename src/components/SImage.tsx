import { Image } from 'expo-image';
import React, { memo, useCallback, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SImageProps {
  source: any;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  allowDownscaling?: boolean;
  transition?: number;
  cachePolicy?: 'none' | 'memory-disk' | 'memory' | 'disk';
  preview?: boolean;
}

const ImagePreviewModal = memo(({ 
  visible, 
  imageSource, 
  onClose 
}: { 
  visible: boolean, 
  imageSource: any, 
  onClose: () => void 
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity 
      style={styles.modalOverlay} 
      activeOpacity={1} 
      onPress={onClose}
    >
      <View style={styles.modalContent}>
        <Image
          style={styles.previewImage}
          source={imageSource}
          contentFit="contain"
          transition={200}
        />
      </View>
    </TouchableOpacity>
  </Modal>
));

const SImage = memo(({
  source,
  style,
  contentFit = 'cover',
  allowDownscaling = true,
  transition = 200,
  cachePolicy = 'none',
  preview = false,
}: SImageProps) => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const handleImagePress = useCallback(() => {
    if (preview) {
      setIsPreviewVisible(true);
    }
  }, [preview]);

  const ImageComponent = (
    <Image
      style={style}
      source={source}
      contentFit={contentFit}
      allowDownscaling={allowDownscaling}
      transition={transition}
      cachePolicy={cachePolicy}
    />
  );

  if (!preview) {
    return ImageComponent;
  }

  return (
    <>
      <TouchableOpacity onPress={handleImagePress}>
        {ImageComponent}
      </TouchableOpacity>
      <ImagePreviewModal
        visible={isPreviewVisible}
        imageSource={source}
        onClose={() => setIsPreviewVisible(false)}
      />
    </>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
});

export default SImage; 