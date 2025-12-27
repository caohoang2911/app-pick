import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import ViewShot, { captureRef } from 'react-native-view-shot';

interface CODReceiptProps {
  orderCode: string;
  invoiceNumber: string;
  codAmount: number;
  employeeName: string;
  employeeCode: string;
  onCaptureComplete?: (base64String: string) => void;
  enableCapture?: boolean;
}

export default function CODReceipt({
  orderCode,
  invoiceNumber,
  codAmount,
  employeeName,
  employeeCode,
  onCaptureComplete,
  enableCapture = false,
}: CODReceiptProps) {
  const viewShotRef = useRef<ViewShot>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const handleCapture = useCallback(async () => {
    if (!viewShotRef.current || !isLayoutReady) {
      return;
    }

    try {
      // Target width cố định 576px
      const targetWidth = 576;

      // Capture ảnh từ ViewShot và lưu tạm
      const capturedUri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 1.0, // Dùng quality cao khi capture, sẽ compress sau
        result: 'tmpfile', // Lưu tạm để resize
      });

      // Resize ảnh về đúng 576px width, giữ tỷ lệ
      const resizedImage = await ImageManipulator.manipulateAsync(
        capturedUri,
        [{ resize: { width: targetWidth } }], // Resize về width 576px, height tự động
        {
          compress: 0.85, // Compress sau khi resize
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true, // Trả về base64 luôn
        },
      );

      // resizedImage.base64 đã có sẵn base64 string
      // Thêm prefix data:image/jpeg;base64,
      const base64String = resizedImage.base64
        ? `data:image/jpeg;base64,${resizedImage.base64}`
        : '';
      // Gọi callback với kết quả base64 (có prefix)
      onCaptureComplete?.(base64String);
    } catch (error) {
      console.error('Error capturing receipt:', error);
      showMessage({
        message: 'Lỗi khi chụp phiếu thu',
        type: 'danger',
      });
    }
  }, [isLayoutReady, onCaptureComplete]);

  useEffect(() => {
    if (enableCapture && isLayoutReady && Number(codAmount) > 0) {
      handleCapture();
    }
  }, [enableCapture, isLayoutReady, codAmount, handleCapture]);

  return (
    <View
      style={{
        position: 'absolute',
        left: -9999,
        opacity: 0,
        pointerEvents: 'none',
      }}
      collapsable={false}
    >
      <ViewShot
        ref={viewShotRef}
        onLayout={() => setIsLayoutReady(true)}
        options={{
          format: 'jpg',
          quality: 0.85,
        }}
      >
        <View
          className="bg-white p-4"
          style={{
            width: 576,
            // Đảm bảo không bị scale
            maxWidth: 576,
            minWidth: 576,
            // Sử dụng PixelRatio để đảm bảo render đúng kích thước
            transform: [{ scaleX: 1 }, { scaleY: 1 }],
          }}
        >
          <Text className="text-black text-4xl font-bold mb-4 text-center">
            PHIẾU THU TIỀN
          </Text>

          <View className="gap-2">
            <Text className="text-black text-2xl font-medium">
              MÃ ĐƠN HÀNG:{' '}
              <Text className="text-black font-bold">{orderCode}</Text>
            </Text>

            <Text className="text-black text-2xl font-medium">
              SỐ HĐ:{' '}
              <Text className="text-black font-bold">{invoiceNumber}</Text>
            </Text>

            <Text className="text-black text-2xl font-medium">
              COD:{' '}
              <Text className="text-black font-bold">
                {formatCurrency(codAmount)}₫
              </Text>
            </Text>

            <Text className="text-black text-2xl font-medium">
              MÃ NHÂN VIÊN:{' '}
              <Text className="text-black font-bold">{employeeCode}</Text>
            </Text>
            <Text className="text-black text-2xl font-medium">
              TÊN NHÂN VIÊN:{' '}
              <Text className="text-black font-bold">{employeeName}</Text>
            </Text>
          </View>
        </View>
      </ViewShot>
    </View>
  );
}
