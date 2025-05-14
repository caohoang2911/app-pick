import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  LayoutChangeEvent,
  Linking,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useUploadImages } from '../api/upload/use-upload-images';

interface ExpoImageUploaderProps {
  title?: string;
  maxImageSize?: number;
  minImageWidth?: number;
  onUploadedImages?: (image: string) => void;
  proofDeliveryImages?: string[];
}

export default function ExpoImageUploader({
  title = "Bằng chứng giao hàng",
  maxImageSize = 1024, // Default max size 1024x1024
  minImageWidth = 80, // Minimum width of each image in pixels
  proofDeliveryImages,
  onUploadedImages,
}: ExpoImageUploaderProps) {
  const [isPending, setIsPending] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<{[key: string]: string}>({});
  const [currentUploadingUri, setCurrentUploadingUri] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width - 32);
  const [imagesPerRow, setImagesPerRow] = useState(3);
  const [itemWidth, setItemWidth] = useState(0);
  
  const refFirstImage = useRef<boolean>(true);

  const { mutate: uploadImages } = useUploadImages(async (data) => {
    console.log('Uploaded images:', data);
    // Mark current image as uploaded on success
    if (currentUploadingUri) {
      setIsPending(false);
      setUploadedImages(prev => ({
        ...prev,
        [currentUploadingUri]: 'uploaded'
      }));
      setCurrentUploadingUri(null);
      onUploadedImages?.(data?.[0]);
    }
  }, (error) => {
    // Remove the failed image
    if (currentUploadingUri) {
      setImages(prev => prev.filter(img => img !== currentUploadingUri));
      setCurrentUploadingUri(null);
    }
  });
  useEffect(() => {
    if(proofDeliveryImages?.length) {
      if(refFirstImage.current) {
        refFirstImage.current = false;
        proofDeliveryImages?.map((image) => {
            setUploadedImages(prev => ({
            ...prev,
            [image]: 'uploaded',
          }));
          onUploadedImages?.(image);
        });
        setImages(proofDeliveryImages || []);
      }
    }
  }, [proofDeliveryImages]);

  // Calculate the layout based on container size
  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };
  
  // Recalculate images per row and item width when container width changes
  useEffect(() => {
    const gapBetweenImages = 8; // Gap between images
    
    // Calculate how many images can fit in a row
    // Formula: Number of images = Floor(containerWidth / (minImageWidth + gap))
    const calculatedImagesPerRow = Math.floor(containerWidth / (minImageWidth + gapBetweenImages));
    
    // We want at least 2 images per row, but no more than would fit with minImageWidth
    const adjustedImagesPerRow = Math.max(2, Math.min(calculatedImagesPerRow, 5));
    setImagesPerRow(adjustedImagesPerRow);
    
    // Calculate the width of each image based on the number of images per row
    // Formula: Image width = (containerWidth - (gap * (imagesPerRow - 1))) / imagesPerRow
    const totalGapWidth = gapBetweenImages * (adjustedImagesPerRow - 1);
    const calculatedItemWidth = (containerWidth - totalGapWidth) / adjustedImagesPerRow;
    setItemWidth(calculatedItemWidth);
  }, [containerWidth, minImageWidth]);

  // Resize image if needed
  const resizeImageIfNeeded = async (uri: string): Promise<string> => {
    try {
      // This is a workaround as getSize is asynchronous but uses callbacks
      return new Promise((resolve) => {
        Image.getSize(uri, async (width, height) => {
          // If image is already smaller than max size, return the original
          if (width <= maxImageSize && height <= maxImageSize) {
            resolve(uri);
          } else {
            // Calculate new dimensions while maintaining aspect ratio
            let newWidth = width;
            let newHeight = height;
            
            if (width > height && width > maxImageSize) {
              newWidth = maxImageSize;
              newHeight = Math.floor(height * (maxImageSize / width));
            } else if (height > maxImageSize) {
              newHeight = maxImageSize;
              newWidth = Math.floor(width * (maxImageSize / height));
            }
            
            // Resize image
            const manipResult = await ImageManipulator.manipulateAsync(
              uri,
              [{ resize: { width: newWidth, height: newHeight } }],
              { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
            );
            
            resolve(manipResult.uri);
          }
        }, (error) => {
          console.error('Error getting image size:', error);
          resolve(uri); // Fall back to original if there's an error
        });
      });
    } catch (error) {
      console.error('Error resizing image:', error);
      return uri; // Return original if there's an error
    }
  };

  // Convert image URI to base64
  const uriToBase64 = async (uri: string): Promise<string> => {
    try {
      // On web, the uri might already be a data URL
      if (uri.startsWith('data:')) {
        return uri;
      }

      // For React Native, we need to fetch the file and convert it
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting URI to base64:', error);
      throw error;
    }
  };

  // Remove an image
  const handleRemoveImage = (index: number) => {
    const imageToRemove = images[index];
    setImages(prev => prev.filter((_, i) => i !== index));

    // Also remove from uploaded images
    if (uploadedImages[imageToRemove]) {
      setUploadedImages(prev => {
        const newState = { ...prev };
        delete newState[imageToRemove];
        return newState;
      });
    }
    
    // If this was the uploading image, clear the current uploading URI
    if (currentUploadingUri === imageToRemove) {
      setCurrentUploadingUri(null);
    }
  };

  // Upload a single image
  const uploadImage = async (uri: string) => {
    try {
      // Set this as the current uploading image
      setCurrentUploadingUri(uri);
      
      // Resize image if needed
      const resizedUri = await resizeImageIfNeeded(uri);
      
      // Convert URI to base64
      const base64Image = await uriToBase64(resizedUri);
      
      // Upload to server
      setIsPending(true);
      uploadImages({ imageBase64s: [base64Image] });

      return true;
    } catch (error) {
      console.error("Error uploading image:", error);
      
      // Remove the failed image from the list
      setImages(prev => prev.filter(img => img !== uri));
      setCurrentUploadingUri(null);
      
      return false;
    }
  };

  // Take a photo using camera
  const takePicture = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Quyền truy cập camera',
            message: 'Ứng dụng cần quyền truy cập camera để chụp ảnh.',
            buttonNeutral: 'Hỏi sau',
            buttonNegative: 'Hủy',
            buttonPositive: 'Đồng ý',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            'Cần quyền truy cập',
            'Ứng dụng cần quyền truy cập camera để chụp ảnh.',
            [
              {
                text: 'Hủy',
                style: 'cancel',
              },
              {
                text: 'Cài đặt',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }
      } else {
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Cần quyền truy cập',
            'Ứng dụng cần quyền truy cập camera để chụp ảnh.',
            [
              {
                text: 'Hủy',
                style: 'cancel',
              },
              {
                text: 'Cài đặt',
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          return;
        }
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
        saveToPhotos: true,
        cameraType: 'back',
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Lỗi', `Không thể chụp ảnh: ${result.errorMessage || 'Lỗi không xác định'}`);
        return;
      }

      if (result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        if (uri) {
          setImages(prev => [...prev, uri]);
          await uploadImage(uri);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.');
    }
  };

  // Select photos from gallery
  const pickImages = async () => {
    try {
      // Check storage permission for Android
      if (Platform.OS === 'android') {
        // For Android 13 (API level 33) and above
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'Quyền truy cập thư viện',
              message: 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh.',
              buttonNeutral: 'Hỏi sau',
              buttonNegative: 'Hủy',
              buttonPositive: 'Đồng ý',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Cần quyền truy cập',
              'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh.',
              [
                {
                  text: 'Hủy',
                  style: 'cancel',
                },
                {
                  text: 'Cài đặt',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            return;
          }
        } else {
          // For Android 12 and below
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            {
              title: 'Quyền truy cập thư viện',
              message: 'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh.',
              buttonNeutral: 'Hỏi sau',
              buttonNegative: 'Hủy',
              buttonPositive: 'Đồng ý',
            },
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert(
              'Cần quyền truy cập',
              'Ứng dụng cần quyền truy cập thư viện ảnh để chọn ảnh.',
              [
                {
                  text: 'Hủy',
                  style: 'cancel',
                },
                {
                  text: 'Cài đặt',
                  onPress: () => Linking.openSettings(),
                },
              ]
            );
            return;
          }
        }
      }

      // Launch image library
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        includeBase64: true,
        selectionLimit: 1,
      });

      // Handle result
      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert('Lỗi', `Không thể chọn ảnh: ${result.errorMessage || 'Lỗi không xác định'}`);
        return;
      }

      if (!result.assets || !result.assets[0] || !result.assets[0].uri) {
        Alert.alert('Lỗi', 'Không thể lấy được ảnh đã chọn');
        return;
      }

      const uri = result.assets[0].uri;
      setImages(prev => [...prev, uri]);
      await uploadImage(uri);
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  // Group images in rows based on calculated imagesPerRow
  const renderImageRows = () => {
    const rows = [];
    const totalRows = Math.ceil(images.length / imagesPerRow);
    
    for (let i = 0; i < totalRows; i++) {
      const startIdx = i * imagesPerRow;
      const rowImages = images.slice(startIdx, startIdx + imagesPerRow);
      
      rows.push(
        <View key={`row-${i}`} style={styles.imageRow}>
          {rowImages.map((image, idx) => (
            <View 
              key={startIdx + idx} 
              style={[styles.imageContainer, { width: itemWidth, height: itemWidth }]}
            >
              <Image source={{ uri: image }} style={styles.image} />
              
              {/* Show upload indicator when this image is uploading */}
              {isPending && currentUploadingUri === image && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
              
              {/* Show upload success indicator */}
              {uploadedImages[image] && (
                <View style={styles.uploadedIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                </View>
              )}
              
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveImage(startIdx + idx)}
                disabled={isPending && currentUploadingUri === image}
              >
                <Ionicons name="close-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      );
    }
    
    return rows;
  };

  return (
    <View style={styles.container} onLayout={onContainerLayout}>
      <View className='flex-row justify-between mb-2'>
        <View>
          {title && (
            <Text style={styles.title}>
              {title} <Text style={styles.required}>*</Text>
            </Text>
          )}
          <Text style={styles.instruction} className='text-gray-500 mt-1'>
            Tải lên ảnh để hoàn thành đơn hàng
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { width: 40, height: 40 }]}
          onPress={() => {
            Alert.alert(
              'Chọn phương thức',
              'Bạn muốn chụp ảnh hay chọn ảnh từ thư viện?',
              [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Chụp ảnh', onPress: takePicture },
                { text: 'Chọn từ thư viện', onPress: pickImages },
              ]
            );
          }}
          disabled={isPending}
        >
          <Ionicons name="camera" size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.imageGrid}>
          {renderImageRows()}
        </View>
      </ScrollView>
      
      {isPending && (
        <View style={styles.uploadingStatusBar}>
          <ActivityIndicator color="#3b82f6" size="small" />
          <Text style={styles.uploadingStatusText}>Đang tải lên...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollContainer: {
    maxHeight: 400,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  instruction: {
    marginBottom: 16,
    fontSize: 14,
    color: '#666',
  },
  sizeLimit: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  required: {
    color: 'red',
  },
  imageGrid: {
    marginBottom: 16,
  },
  imageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadedIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    borderWidth: 2,
    borderColor: '#ccc',
    marginTop: 5,
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 4,
    marginTop: 8,
  },
  uploadingStatusText: {
    marginLeft: 8,
    color: '#3b82f6',
    fontWeight: '500',
  },
}); 