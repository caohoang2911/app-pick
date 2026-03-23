import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DrawerActions } from '@react-navigation/native';

import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useNavigation } from 'expo-router';
import { toUpper } from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Images } from '~/assets';
import { useAssignMeToStore } from '~/src/api/app-pick/use-assign-me-to-store';
import { useRefreshToken } from '~/src/api/auth/use-refresh-token';
import { queryClient } from '~/src/api/shared';
import { Avatar, AvatarImage } from '~/src/components/Avatar';
import TabsStatus from '~/src/components/orders/tab-status';
import { useAuth } from '~/src/core';
import { useRole, useRoleDriver } from '~/src/core/hooks/useRole';
import { useConfig } from '~/src/core/store/config';
import { setLoading } from '~/src/core/store/loading';
import { toggleScanQrCode, useOrders } from '~/src/core/store/orders';
import { getConfigNameById } from '~/src/core/utils/config';
import { Option } from '~/src/types/commons';
import { Role } from '~/src/types/employee';
import { colors } from '~/src/ui/colors';
import { Badge } from '../Badge';
import OrderListHeaderSkeleton from '../shared/skeleton/order-list-header-skeleton';
import StoreSelection from '../shared/StoreSelection';
import Skeleton from '../Skeleton';
import AssignStoreBottomSheet from './assign-store-bottom-sheet';
import DeliveryType from './delivery-type';
import InputSearch from './input-search';
import OrderStatusBottomSheet from './order-status-bottom-sheet';

const MAX_DRIVER_ASSIGNED_STORE_CODES = 2;

const Header = () => {
  const userInfo = useAuth.use.userInfo();

  const role = useRole();

  const config = useConfig.use.config();
  const stores = config?.stores || [];
  const employeeRoles = config?.employeeRoles || [];
  const storeRef = useRef<any>(null);
  const storeName = getConfigNameById(stores, userInfo?.storeCode);
  const roleName = getConfigNameById(employeeRoles, userInfo?.role);

  const driverAssignedStoreCodes = userInfo?.driverAssignedStoreCodes || [];
  const driverOrderAssignStatus = userInfo?.driverOrderAssignStatus;

  const isPickerShiftStatusOnShift = userInfo?.kposShiftStatus === 'ON_SHIFT';

  const isDriver = useRoleDriver();
  const selectedOrderCounter = useOrders.use.selectedOrderCounter();
  const deliveryType = useOrders.use.deliveryType();
  const fromScanQrCode = useOrders.use.fromScanQrCode();
  const searchParams = useMemo(
    () => ({
      status: fromScanQrCode ? 'ALL' : selectedOrderCounter,
      deliveryType: fromScanQrCode ? null : deliveryType,
    }),
    [selectedOrderCounter, deliveryType, fromScanQrCode],
  );

  const orderStatusBottomSheetRef = useRef<any>(null);
  const assignStoreBottomSheetRef = useRef<any>(null);

  const handleOrderStatusBottomSheet = () => {
    orderStatusBottomSheetRef.current?.present();
  };

  const handleAssignStoreBottomSheet = () => {
    assignStoreBottomSheetRef.current?.present();
  };

  const { mutate: assignMeToStore } = useAssignMeToStore(() => {
    refreshTokenAsync();
  });

  const { mutateAsync: refreshTokenAsync, isPending: isPendingRefreshToken } =
    useRefreshToken((data) => {
      queryClient.invalidateQueries({});
    });

  // Track mutation state from mutationKey to get isPending from any instance
  const isLoadingRefreshToken =
    useIsMutating({ mutationKey: ['refreshToken'] }) > 0;
  const isLoadingGetMyProfile =
    useIsMutating({ mutationKey: ['getMyProfile'] }) > 0;
  const isLoadingOrderListInitial =
    useIsFetching({
      queryKey: ['searchOrders', searchParams],
      exact: true,
      predicate: (query) =>
        query.state.status === 'pending' &&
        query.state.data === undefined &&
        query.getObserversCount() > 0,
    }) > 0;
  const canShowInitialSkeletonRef = useRef(true);
  const hasSeenInitialLoadingRef = useRef(false);

  useEffect(() => {
    if (isLoadingOrderListInitial) {
      hasSeenInitialLoadingRef.current = true;
      return;
    }

    // Only lock skeleton after we have truly seen initial loading once.
    // This avoids turning it off too early during first mount race.
    if (
      canShowInitialSkeletonRef.current &&
      hasSeenInitialLoadingRef.current &&
      !isLoadingOrderListInitial
    ) {
      canShowInitialSkeletonRef.current = false;
    }
  }, [isLoadingOrderListInitial]);

  const shouldShowInitialSkeleton =
    canShowInitialSkeletonRef.current && isLoadingOrderListInitial;

  const navigation = useNavigation();
  const toggleMenu = () => navigation.dispatch(DrawerActions.toggleDrawer());

  const handleSelectedStore = (store: Option & { address: string }) => {
    setLoading(true);
    assignMeToStore({ storeCode: store?.id });
  };

  const handleOpenStoreSelection = useCallback(() => {
    storeRef.current?.present();
  }, []);

  const renderStoreSelection = useMemo(() => {
    return (
      <View className="flex gap-1 mt-1">
        <View className="flex flex-row items-center gap-1 self-start">
          {isLoadingRefreshToken || isLoadingGetMyProfile ? (
            <Skeleton width={100} height={20} variant="round-rectangle" />
          ) : (
            <Pressable onPress={handleOpenStoreSelection} hitSlop={10}>
              <View className="flex flex-row items-center rounded-full px-1.5 py-1 bg-blue-50">
                <Ionicons
                  className="mr-1"
                  name="storefront-outline"
                  size={12}
                  color={colors.blue[400]}
                />
                <Text className="text-xs font-medium text-blue-600">
                  {userInfo?.storeCode} - {storeName}
                </Text>
                <MaterialIcons
                  name={'keyboard-arrow-down'}
                  size={16}
                  color={colors.blue[400]}
                />
              </View>
            </Pressable>
          )}
        </View>
        {isLoadingRefreshToken || isLoadingGetMyProfile ? (
          <Skeleton width={120} height={20} variant="round-rectangle" />
        ) : (
          <View className="self-start">
            <Badge
              icon={
                <Ionicons
                  name={
                    !isPickerShiftStatusOnShift
                      ? 'notifications-off-outline'
                      : 'notifications-outline'
                  }
                  size={12}
                  color={!isPickerShiftStatusOnShift ? 'red' : 'green'}
                />
              }
              label={
                !isPickerShiftStatusOnShift
                  ? 'Chưa vào ca KPOS'
                  : 'Đang vào ca KPOS'
              }
              variant={!isPickerShiftStatusOnShift ? 'danger' : 'success'}
            />
          </View>
        )}
      </View>
    );
  }, [
    userInfo,
    storeName,
    isLoadingRefreshToken,
    isPickerShiftStatusOnShift,
    handleOpenStoreSelection,
  ]);

  const renderDriverSelection = useMemo(() => {
    const isDisable = driverOrderAssignStatus === 'DISABLE';
    return (
      <View className="flex flex-row items-center gap-2 mt-1 ">
        <Pressable onPress={handleOrderStatusBottomSheet}>
          <Badge
            icon={
              <Ionicons
                name={
                  isDisable
                    ? 'notifications-off-outline'
                    : 'notifications-outline'
                }
                size={12}
                color={isDisable ? 'red' : 'green'}
              />
            }
            label={isDisable ? 'Ngưng nhận đơn' : 'Đang nhận đơn'}
            variant={isDisable ? 'danger' : 'success'}
          />
        </Pressable>
        <View className="flex flex-row items-center gap-1 flex-1">
          <Pressable onPress={handleAssignStoreBottomSheet}>
            <Badge
              className="self-start"
              label={
                driverAssignedStoreCodes
                  .slice(0, MAX_DRIVER_ASSIGNED_STORE_CODES)
                  .join(', ') +
                (driverAssignedStoreCodes.length >
                MAX_DRIVER_ASSIGNED_STORE_CODES
                  ? ` (+${driverAssignedStoreCodes.length - MAX_DRIVER_ASSIGNED_STORE_CODES})`
                  : '')
              }
              variant="default"
            />
          </Pressable>
        </View>
      </View>
    );
  }, [userInfo, storeName, driverAssignedStoreCodes, driverOrderAssignStatus]);

  if (shouldShowInitialSkeleton) {
    return <OrderListHeaderSkeleton />;
  }

  return (
    <View className="py-2 bg-blue-100">
      <View className="flex px-4 flex-row justify-between items-center mb-2">
        <View className="flex flex-row gap-2 items-center">
          <TouchableOpacity onPress={toggleMenu}>
            <Avatar>
              <AvatarImage source={Images.avatar_default} alt="@shadcn" />
            </Avatar>
          </TouchableOpacity>
          <View className="flex-grow">
            <View className="flex flex-row items-center justify-between gap-2 flex-grow">
              <View className="flex-1 mr-2">
                <Text
                  className="font-semibold text-base"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {userInfo?.name} - {toUpper(userInfo?.username)}
                </Text>
              </View>

              <View className="flex-shrink-0 flex-row gap-3 justify-center items-center">
                <Pressable
                  className="flex flex-row items-center gap-1"
                  hitSlop={10}
                  onPress={() => refreshTokenAsync()}
                >
                  {isPendingRefreshToken ? (
                    <ActivityIndicator size="small" color={colors.blue[400]} />
                  ) : (
                    <MaterialIcons
                      name="refresh"
                      size={14}
                      color={colors.blue[400]}
                    />
                  )}
                </Pressable>
                <Badge label={roleName || userInfo?.role} />
              </View>
            </View>
            {!isDriver && renderStoreSelection}
            {isDriver && renderDriverSelection}
          </View>
        </View>
      </View>
      <View className="flex flex-row mt-2 justify-between z-10 items-center gap-3">
        <InputSearch toggleScanQrCode={() => toggleScanQrCode(true)} />
      </View>
      <View className="px-4">
        <TabsStatus />
      </View>
      {role !== Role.DRIVER && (
        <View className="mt-2 px-4">
          <DeliveryType />
        </View>
      )}
      {/* Bottom sheet */}
      <StoreSelection
        onSelect={handleSelectedStore}
        ref={storeRef}
        selectedId={userInfo?.storeCode}
      />
      <OrderStatusBottomSheet
        ref={orderStatusBottomSheetRef}
        onClose={handleOrderStatusBottomSheet}
        currentStatus={driverOrderAssignStatus}
      />

      <AssignStoreBottomSheet
        ref={assignStoreBottomSheetRef}
        driverAssignedStoreCodes={driverAssignedStoreCodes}
      />
    </View>
  );
};

export default Header;
