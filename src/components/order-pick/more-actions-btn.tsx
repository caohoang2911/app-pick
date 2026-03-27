import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useCanEditOrderPick } from '~/src/core/hooks/useCanEditOrderPick';
import {
  setActionProduct,
  setCurrentId,
  setIsEditManual,
  setIsVisibleReplaceProduct,
  setSuccessForBarcodeScan,
  toggleShowAmountInput,
  useOrderPick,
} from '~/src/core/store/order-pick';
import { More2Fill } from '~/src/core/svgs';
import SBottomSheet from '../SBottomSheet';
import { useOrderPickProductsFlat } from '~/src/core/hooks/useOrderPickProductsFlat';
import { Product } from '~/src/types/product';
import {
  PRODUCT_ACTIONS,
  PRODUCT_ACTION_LABELS,
} from '@/core/constants/product';

const actions = [
  {
    key: PRODUCT_ACTIONS.OUT_OF_STOCK,
    title: PRODUCT_ACTION_LABELS[PRODUCT_ACTIONS.OUT_OF_STOCK],
    icon: <AntDesign name="tago" size={20} color="black" />,
  },
  {
    key: PRODUCT_ACTIONS.LOW_QUALITY,
    title: PRODUCT_ACTION_LABELS[PRODUCT_ACTIONS.LOW_QUALITY],
    icon: <AntDesign name="tago" size={20} color="black" />,
  },
  {
    key: PRODUCT_ACTIONS.NEAR_EXPIRY,
    title: PRODUCT_ACTION_LABELS[PRODUCT_ACTIONS.NEAR_EXPIRY],
    icon: <AntDesign name="tago" size={20} color="black" />,
  },
  {
    key: PRODUCT_ACTIONS.EXPIRED_ONLINE,
    title: PRODUCT_ACTION_LABELS[PRODUCT_ACTIONS.EXPIRED_ONLINE],
    icon: <AntDesign name="tago" size={20} color="black" />,
  },
  {
    key: PRODUCT_ACTIONS.INCORRECT_STOCK,
    title: PRODUCT_ACTION_LABELS[PRODUCT_ACTIONS.INCORRECT_STOCK],
    icon: <AntDesign name="tago" size={20} color="black" />,
  },
  {
    key: PRODUCT_ACTIONS.PICK_WEIGHT_EXCEEDS_LIMIT,
    title: PRODUCT_ACTION_LABELS[PRODUCT_ACTIONS.PICK_WEIGHT_EXCEEDS_LIMIT],
    icon: <AntDesign name="tago" size={20} color="black" />,
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

  const orderPickProductsFlat = useOrderPickProductsFlat();

  const currentProduct = orderPickProductsFlat.find(
    (product: Product) => Number(product.id) === Number(id),
  );

  const { tags } = currentProduct || {};

  const shouldEnableReplaceProduct = useMemo(() => {
    return tags?.includes('REPLACEABLE') && !currentProduct?.pickedErrorType;
  }, [tags, currentProduct?.pickedErrorType]);

  const shouldDisplayEdit =
    useCanEditOrderPick(code as string) && isAllowEditPickQuantity;

  const renderItem = useMemo(
    () =>
      ({
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
            className={`flex-row flex-grow items-center px-4 py-4 border border-x-0 border-t-0 border-b-1 border-gray-200 gap-4 ${!enable ? 'opacity-50' : ''}`}
          >
            <View className="flex-row items-center gap-4">{icon}</View>
            <View className="flex-1">
              <Text className="text-gray-300">{title}</Text>
            </View>
          </Pressable>
        );
      },
    [],
  );

  const handleClickAction = useCallback(
    (key: string) => {
      if (key === 'edit-pick-quantity') {
        return;
      }

      if (key === 'replace-product') {
        setIsVisibleReplaceProduct(true);
        onReplaceProduct();
        return;
      }

      toggleShowAmountInput(true, id);
      setSuccessForBarcodeScan(barcode);
      setCurrentId(id);
      switch (key) {
        case PRODUCT_ACTIONS.OUT_OF_STOCK:
          setIsEditManual(true, PRODUCT_ACTIONS.OUT_OF_STOCK);
          break;
        case PRODUCT_ACTIONS.LOW_QUALITY:
          setActionProduct(PRODUCT_ACTIONS.LOW_QUALITY);
          break;
        case PRODUCT_ACTIONS.NEAR_EXPIRY:
          setActionProduct(PRODUCT_ACTIONS.NEAR_EXPIRY);
          break;
        case PRODUCT_ACTIONS.EXPIRED_ONLINE:
          setActionProduct(PRODUCT_ACTIONS.EXPIRED_ONLINE);
          break;
        case PRODUCT_ACTIONS.INCORRECT_STOCK:
          setActionProduct(PRODUCT_ACTIONS.INCORRECT_STOCK);
          break;
        case PRODUCT_ACTIONS.PICK_WEIGHT_EXCEEDS_LIMIT:
          setActionProduct(PRODUCT_ACTIONS.PICK_WEIGHT_EXCEEDS_LIMIT);
          break;
        default:
          break;
      }
      setVisible(false);
    },
    [code, id, barcode],
  );

  useEffect(() => {
    if (visible) {
      actionRef.current?.present();
    }
  }, [visible]);

  return (
    <>
      <TouchableOpacity onPress={() => setVisible(true)} hitSlop={15}>
        <More2Fill width={18} height={18} />
      </TouchableOpacity>
      {visible && (
        <SBottomSheet
          title="Thao tác"
          visible={visible}
          onClose={() => setVisible(false)}
          ref={actionRef}
          snapPoints={[480]}
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
              {renderItem({ ...item, onClickAction: handleClickAction })}
            </React.Fragment>
          ))}
        </SBottomSheet>
      )}
    </>
  );
};

export default MoreActionsBtn;
