import React, { useRef } from 'react'
import StoreSelection from './StoreSelection'
import { View } from 'react-native'
import { Button } from '../Button'

interface Props {
  code?: string | null;
}

const RequestPermissionStore = ({ code }: Props) => {
  const ref = useRef<any>(null)

  const handleRequestPermission = () => {
    ref.current.present()
  }
  
  return (
    <View className='flex-1 bg-white justify-center items-center'>
      <Button label='Yêu cầu cấp quyền siêu thị' onPress={handleRequestPermission} />
      <StoreSelection
        ref={ref}
        onSelect={() => {}}
        selectedId={''}
        code={code}
        newbie={true}
      />  
    </View>
  )
}

export default RequestPermissionStore