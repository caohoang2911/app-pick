import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useCanEditOrderPick } from '~/src/core/hooks/useCanEditOrderPick';
import { setActionProduct, setCurrentId, setIsEditManual, setIsVisibleReplaceProduct, setSuccessForBarcodeScan, toggleShowAmountInput, useOrderPick } from '~/src/core/store/order-pick';
import { More2Fill } from '~/src/core/svgs';
import SBottomSheet from '../SBottomSheet';
import { getOrderPickProductsFlat } from '~/src/core/utils/order-bag';
import { Product } from '~/src/types/product';

const actions = [
  {
    key: 'out-of-stock',
    title: 'Sản phẩm hết hàng',
    icon: <AntDesign name="tago" size={20} color="black" />
  },
  {
    key: 'low-quality',
    title: 'Sản phẩm giảm chất lượng',
    icon: <AntDesign name="tago" size={20} color="black" />
  },
  {
    key: 'near-date',
    title: 'Sản phẩm cận date',
    icon: <AntDesign name="tago" size={20} color="black" />
  },
  {
    key: 'incorrect-stock',
    title: 'Sản phẩm sai tồn',
    icon: <AntDesign name="tago" size={20} color="black" />
  },
];

interface MoreActionsBtnProps {
  code: string;
  id: number;
  barcode: string;
  isAllowEditPickQuantity: boolean;
  onEditPress: () => void;
  onReplaceProduct: () => void;
}

const MoreActionsBtn = ({
  code,
  id,
  barcode,
  isAllowEditPickQuantity,
  onEditPress,
  onReplaceProduct,
}: MoreActionsBtnProps) => {
  const [visible, setVisible] = useState(false);
  const actionRef = useRef<any>();

  const orderPickProducts = useOrderPick.use.orderPickProducts();
  const orderPickProductsFlat = getOrderPickProductsFlat(orderPickProducts);
  
  const currentProduct = orderPickProductsFlat.find((product: Product) => Number(product.id) === Number(id));

  const { tags } = currentProduct || {};


  const shouldEnableReplaceProduct = useMemo(() => {
    return tags?.includes('REPLACEABLE');
  }, [tags]);

  const shouldDisplayEdit = useCanEditOrderPick() && isAllowEditPickQuantity;

  const renderItem = useMemo(() => ({
    onClickAction,
    key,
    title,
    icon,
    enable = true,
  }: {
    key: string;
    title: string | React.ReactNode;
    icon: React.ReactNode;
    onClickAction: (key: string) => void;
    enable?: boolean;
  }) => {
    return (
      <Pressable
        disabled={!enable}
        onPress={() => onClickAction?.(key)}
        className={`flex-row items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4 ${!enable ? 'opacity-50' : ''}`}
      >
        {icon}
        <Text className="text-gray-300">{title}</Text>
      </Pressable>
    );
  }, []);

  const handleClickAction = useCallback((key: string) => {
    if(key === 'edit-pick-quantity') {
      return;
    }

    if(key === 'replace-product') {
      setIsVisibleReplaceProduct(true);
      onReplaceProduct();
      return;
    }

    toggleShowAmountInput(true, id);
    setSuccessForBarcodeScan(barcode);
    setCurrentId(id);
    switch (key) {
      case 'out-of-stock':
        setIsEditManual(true, 'out-of-stock');
        break;
      case 'low-quality':
        setActionProduct('low-quality');
        break;
      case 'near-date':
        setActionProduct('near-date');
        break;
      case 'incorrect-stock':
        setActionProduct('incorrect-stock');
        break;
      default:
        break;
    }
    setVisible(false);
  }, [code, id, barcode]);

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);


  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} hitSlop={15} >
        <More2Fill width={18} height={18} />
      </TouchableOpacity>
      {visible && (
        <SBottomSheet 
          title="Thao tác" 
          visible={visible} 
          onClose={() => setVisible(false)} 
          ref={actionRef}
          snapPoints={[390]}
        >
          {renderItem({
            key: 'edit-pick-quantity',
            title: 'Sửa số lượng',
            icon: <AntDesign name="edit" size={20} color="black" />,
            onClickAction: onEditPress,
            enable: shouldDisplayEdit,
          })}
          {renderItem({
            key: 'replace-product',
            title: 'Thay thế sản phẩm',
            icon: <Ionicons name="swap-horizontal" size={20} color="black" />,
            onClickAction: handleClickAction,
            enable: shouldEnableReplaceProduct,
          })}
          {actions.map((item) => (
            <React.Fragment key={item.key}>
              {renderItem({...item, onClickAction: handleClickAction})}
            </React.Fragment>
          ))}
        </SBottomSheet>
       )
      }
    </>
  )
}

export default MoreActionsBtn;