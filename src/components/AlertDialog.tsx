import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hideAlert, useAlertStore } from '../core/store/alert-dialog';

const AlertDialog = () => {  
  const { isVisible, message, title, onConfirm, onCancel } = useAlertStore();

  if(!isVisible) return null;

  return (  
    <View style={styles.container}>  
      <Modal  
        animationType="fade"  
        transparent={true}  
        visible={isVisible}  
        onRequestClose={hideAlert}  
      >  
        <View style={styles.modalBackground}>  
          <View className=' bg-white rounded-lg' style={{ width: 270 }}>  
            <View className='px-4 py-5'>
              {title && <Text className='text-center text-lg font-semibold'>{title}</Text>}
              {message && <Text className='text-center text-sm mt-2' style={{lineHeight: 20}}>{message}</Text>}
            </View>
            <View className="flex flex-row w-full border-t border-gray-200">
              <View className='flex-1 py-3 border-r border-gray-200'>
                <TouchableOpacity onPress={onCancel || hideAlert}>
                  <Text className='text-center text-blue-500 text-lg'>Trở lại</Text>
                </TouchableOpacity>
              </View>
              <View className='flex-1 py-3'>
                <TouchableOpacity onPress={onConfirm}>
                  <Text className='text-center text-blue-500 text-lg font-semibold'>Xác nhận</Text>
                </TouchableOpacity>
              </View>
            </View> 
          </View>  
        </View>  
      </Modal>  
    </View>  
  );  
};  

const styles = StyleSheet.create({  
  container: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },  
  modalBackground: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    backgroundColor: 'rgba(0, 0, 0, 0.2)',  
  },
});  

export default AlertDialog;  