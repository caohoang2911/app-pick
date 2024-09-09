import React, { useState } from 'react';  
import { Modal, View, Text, StyleSheet } from 'react-native';  
import { TouchableOpacity } from 'react-native-gesture-handler';

const AlertDialog = () => {  
  const [modalVisible, setModalVisible] = useState(true);  

  const showAlert = () => {  
    setModalVisible(true);  
  };  

  const hideAlert = () => {  
    setModalVisible(false);  
  };  

  return (  
    <View style={styles.container}>  
      <Modal  
        animationType="slide"  
        transparent={true}  
        visible={modalVisible}  
        onRequestClose={hideAlert}  
      >  
        <View style={styles.modalBackground}>  
          <View className=' bg-white rounded-lg' style={{ width: 270 }}>  
            <View className='px-4 py-5'>
              <Text className='text-center text-lg font-semibold'>Xác nhận bắt đầu pick hàng</Text> 
              <Text className='text-center text-sm mt-2' style={{lineHeight: 20}}>Nút scan sản phẩm sẽ được bật khi xác nhận pick hàng</Text> 
            </View>
            <View className="flex flex-row w-full border-t border-gray-200">
              <View className='flex-1 py-3 border-r border-gray-200'>
                <TouchableOpacity className='flex-1' onPress={hideAlert}>
                  <Text className='text-center text-blue-500 text-lg'>Trở lại</Text>
                </TouchableOpacity>
              </View>
              <View className='flex-1 py-3'>
                <TouchableOpacity className='flex-1' onPress={hideAlert}>
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
  },  
  modalBackground: {  
    flex: 1,  
    justifyContent: 'center',  
    alignItems: 'center',  
    backgroundColor: 'rgba(0, 0, 0, 0.2)',  
  },
});  

export default AlertDialog;  