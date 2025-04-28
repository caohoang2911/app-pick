import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import ProofImageUploader from '../ProofImageUploader';
import axios from 'axios';
import { SectionAlert } from '../SectionAlert';

export default function ProofSection() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [status, setStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  const handleImagesUploaded = async (imageUrls: string[]) => {
    try {
      const response = await axios.post(
        "http://localhost:8522/app-pick/completeOrder",
        {
          orderCode: code,
          proofImages: imageUrls,
        }
      );
      
      if (response.data.data === "SUCCESS") {
        setStatus('success');
        return Promise.resolve();
      } else {
        setStatus('error');
        setErrorMessage('Không thể hoàn thành đơn hàng');
        return Promise.reject(new Error('Failed to complete order'));
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Đã xảy ra lỗi khi hoàn thành đơn hàng');
      return Promise.reject(error);
    }
  };

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <SectionAlert variant='success'>
          <Text>Đơn hàng đã được hoàn thành thành công!</Text>
        </SectionAlert>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {status === 'error' && (
        <SectionAlert variant='danger'>
          <Text>{errorMessage}</Text>
        </SectionAlert>
      )}
      
      <ProofImageUploader 
        orderCode={code as string}
        onImagesUploaded={handleImagesUploaded}
        title="Ảnh chứng minh giao hàng"
        buttonText="Xác nhận giao hàng"
      />
      
      <Text style={styles.note}>
        * Bạn cần chụp 3 ảnh chứng minh việc giao hàng thành công
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
  },
  note: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  }
}); 