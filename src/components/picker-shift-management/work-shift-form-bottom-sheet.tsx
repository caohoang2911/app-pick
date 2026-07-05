import moment from 'moment-timezone';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useSaveWorkShift } from '~/src/api/app-pick/use-save-work-shift';
import { useSearchEmployees } from '~/src/api/app-pick/use-search-employees';
import { Button } from '~/src/components/Button';
import SDropdown from '~/src/components/SDropdown';
import SBottomSheet from '~/src/components/SBottomSheet';
import {
  WORK_SHIFT_EMPLOYEE_ROLES,
  WORK_SHIFT_PRESETS,
  type WorkShiftPreset,
} from '~/src/core/constants/work-shift';
import { useConfig } from '~/src/core/store/config';
import { getConfigNameById } from '~/src/core/utils/config';
import {
  WORK_SHIFT_TIMEZONE,
  buildWorkShiftTimes,
  getWorkShiftPresetForTimes,
} from '~/src/core/utils/work-shift';
import type { WorkShift } from '~/src/types/work-shift';

export type WorkShiftFormBottomSheetRef = {
  present: (options: { dayKey: string; shift?: WorkShift }) => void;
  dismiss: () => void;
};

type Props = {
  onSuccess: () => void;
};

type EmployeeOption = {
  id: number;
  name: string;
  username: string;
  role?: string;
};

const WorkShiftFormBottomSheet = forwardRef<WorkShiftFormBottomSheetRef, Props>(
  ({ onSuccess }, ref) => {
    const [visible, setVisible] = useState(false);
    const [dayKey, setDayKey] = useState('');
    const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
    const [selectedEmployee, setSelectedEmployee] =
      useState<EmployeeOption | null>(null);
    const [selectedPreset, setSelectedPreset] =
      useState<WorkShiftPreset | null>(WORK_SHIFT_PRESETS[0] ?? null);
    const sheetRef = useRef<any>(null);
    const employeeRoles = useConfig.use.config()?.employeeRoles || [];

    const isEdit = !!editingShift;

    const { data: employeesData } = useSearchEmployees(
      '',
      WORK_SHIFT_EMPLOYEE_ROLES,
      visible,
    );

    const employees = employeesData?.data ?? [];

    const getEmployeeRoleLabel = useCallback(
      (role?: string) => getConfigNameById(employeeRoles, role) || role || '',
      [employeeRoles],
    );

    const employeeDropdownData = useMemo(() => {
      const items = employees.map((employee) => ({
        id: String(employee.id),
        name: `${employee.name} - ${employee.username}`,
        subtitle: getEmployeeRoleLabel(employee.role),
      }));

      if (
        selectedEmployee &&
        !items.some((item) => item.id === String(selectedEmployee.id))
      ) {
        items.unshift({
          id: String(selectedEmployee.id),
          name: `${selectedEmployee.name} - ${selectedEmployee.username}`,
          subtitle: getEmployeeRoleLabel(selectedEmployee.role),
        });
      }

      return items;
    }, [employees, getEmployeeRoleLabel, selectedEmployee]);

    const presetDropdownData = useMemo(
      () =>
        WORK_SHIFT_PRESETS.map((preset) => ({
          id: preset.id,
          name: preset.label,
        })),
      [],
    );

    const selectedPresetId = selectedPreset?.id ?? '';

    const { mutate: saveWorkShift, isPending } = useSaveWorkShift(() => {
      showMessage({
        message: isEdit ? 'Cập nhật ca thành công' : 'Thêm ca thành công',
        type: 'success',
      });
      sheetRef.current?.dismiss();
      onSuccess();
    });

    const resetForm = useCallback(() => {
      setSelectedEmployee(null);
      setSelectedPreset(WORK_SHIFT_PRESETS[0] ?? null);
      setEditingShift(null);
      setDayKey('');
    }, []);

    useImperativeHandle(ref, () => ({
      present: ({ dayKey: nextDayKey, shift }) => {
        setDayKey(nextDayKey);
        setEditingShift(shift ?? null);

        if (shift) {
          setSelectedEmployee({
            id: shift.employee.id,
            name: shift.employee.name,
            username: shift.employee.username,
          });
          setSelectedPreset(
            getWorkShiftPresetForTimes(shift.startTime, shift.endTime) ??
              WORK_SHIFT_PRESETS[0] ??
              null,
          );
        } else {
          setSelectedEmployee(null);
          setSelectedPreset(WORK_SHIFT_PRESETS[0] ?? null);
        }

        setVisible(true);
      },
      dismiss: () => {
        sheetRef.current?.dismiss();
      },
    }));

    useEffect(() => {
      if (visible) {
        requestAnimationFrame(() => sheetRef.current?.present());
      }
    }, [visible]);

    const handleClose = useCallback(() => {
      setVisible(false);
      resetForm();
    }, [resetForm]);

    const title = useMemo(() => {
      const date = moment.tz(dayKey, 'YYYY-MM-DD', WORK_SHIFT_TIMEZONE);
      const prefix = isEdit ? 'Sửa ca' : 'Thêm ca';
      return `${prefix} ${date.format('DD / MM / YY')}`;
    }, [dayKey, isEdit]);

    const handleConfirm = useCallback(() => {
      if (!selectedEmployee || !selectedPreset || !dayKey) {
        showMessage({
          message: 'Vui lòng chọn nhân viên và ca làm việc',
          type: 'danger',
        });
        return;
      }

      const { startTime, endTime } = buildWorkShiftTimes(
        dayKey,
        selectedPreset,
      );

      saveWorkShift({
        data: {
          ...(editingShift ? { id: editingShift.id } : {}),
          startTime,
          endTime,
          employee: {
            id: selectedEmployee.id,
            name: selectedEmployee.name,
          },
        },
      });
    }, [dayKey, editingShift, saveWorkShift, selectedEmployee, selectedPreset]);

    const handleSelectEmployee = useCallback(
      (value: string) => {
        const employee = employees.find((entry) => String(entry.id) === value);
        if (employee) {
          setSelectedEmployee({
            id: employee.id,
            name: employee.name,
            username: employee.username,
            role: employee.role,
          });
          return;
        }

        if (selectedEmployee && String(selectedEmployee.id) === value) {
          return;
        }
      },
      [employees, selectedEmployee],
    );

    const handleSelectPreset = useCallback((value: string) => {
      const preset = WORK_SHIFT_PRESETS.find((entry) => entry.id === value);
      if (preset) {
        setSelectedPreset(preset);
      }
    }, []);

    return (
      <SBottomSheet
        ref={sheetRef}
        visible={visible}
        title={title}
        titleAlign="center"
        snapPoints={[380]}
        onClose={handleClose}
        extraButton={
          <Button
            label="Xác nhận"
            onPress={handleConfirm}
            loading={isPending}
            disabled={isPending}
          />
        }
      >
        <View className="px-4 pb-4 gap-5 mt-3">
          <SDropdown
            mode="modal"
            label="Chọn nhân viên"
            labelClasses="text-sm font-medium text-gray-700"
            placeholder="Chọn nhân viên"
            data={employeeDropdownData}
            value={selectedEmployee ? String(selectedEmployee.id) : undefined}
            onSelect={handleSelectEmployee}
            modalProps={{ height: 420 }}
          />

          <SDropdown
            mode="modal"
            label="Chọn ca"
            labelClasses="text-sm font-medium text-gray-700"
            placeholder="Chọn ca"
            data={presetDropdownData}
            value={selectedPresetId || undefined}
            onSelect={handleSelectPreset}
            modalProps={{ height: 220 }}
          />
        </View>
      </SBottomSheet>
    );
  },
);

export default WorkShiftFormBottomSheet;
