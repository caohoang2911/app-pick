import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Input, InputProps } from './Input';

export type SBottomSheetTextInputHandle = {
  /** Đọc giá trị hiện tại (dùng lúc submit, không cần kéo state lên cha). */
  getValue: () => string;
  /** Đặt lại giá trị + xoá lỗi (mặc định rỗng) — vd reset khi mở lại sheet. */
  reset: (next?: string) => void;
  focus: () => void;
  /** Chạy validate, hiện lỗi (nếu có) và trả về true nếu hợp lệ. */
  validate: () => boolean;
};

type Props = Omit<InputProps, 'value' | 'defaultValue' | 'error'> & {
  initialValue?: string;
  /** Báo giá trị mới cho cha nếu cần (đừng dùng để set state cha — sẽ mất cô lập). */
  onValueChange?: (value: string) => void;
  /** Trả về message lỗi (chuỗi) hoặc undefined nếu hợp lệ. */
  validate?: (value: string) => string | undefined;
  /** Tự validate khi blur (mặc định true). */
  validateOnBlur?: boolean;
};

/**
 * Ô nhập dùng trong SBottomSheet: TỰ giữ state (value + error) ở LEAF để cô lập
 * re-render — gõ phím / hiện lỗi chỉ re-render component này, KHÔNG lan lên
 * SBottomSheet / cha (miễn là cha đừng truyền prop đổi reference mỗi render).
 *
 * Lỗi validate hiển thị ngay dưới ô (prop `error` của Input). Lấy giá trị qua
 * `ref.getValue()` và kiểm tra hợp lệ qua `ref.validate()` lúc submit — không
 * cần đưa value/error lên component cha (nơi sẽ kéo cả subtree sheet re-render).
 */
const SBottomSheetTextInput = forwardRef<SBottomSheetTextInputHandle, Props>(
  (
    {
      initialValue = '',
      onValueChange,
      onChangeText,
      onBlur,
      validate,
      validateOnBlur = true,
      ...rest
    },
    ref,
  ) => {
    const [value, setValue] = useState(initialValue);
    const [error, setError] = useState<string | undefined>();
    const valueRef = useRef(initialValue);
    const inputRef = useRef<any>(null);

    const runValidate = useCallback(
      (text: string) => {
        const message = validate?.(text);
        setError(message);
        return !message;
      },
      [validate],
    );

    const handleChangeText = useCallback(
      (text: string) => {
        valueRef.current = text;
        setValue(text);
        // Đang hiện lỗi thì cập nhật lại khi user sửa (live-clear/refresh).
        setError((prev) => (prev ? validate?.(text) : prev));
        onValueChange?.(text);
        onChangeText?.(text);
      },
      [validate, onValueChange, onChangeText],
    );

    const handleBlur = useCallback(
      (e: any) => {
        if (validateOnBlur) runValidate(valueRef.current);
        onBlur?.(e);
      },
      [validateOnBlur, runValidate, onBlur],
    );

    useImperativeHandle(
      ref,
      () => ({
        getValue: () => valueRef.current,
        reset: (next = '') => {
          valueRef.current = next;
          setValue(next);
          setError(undefined);
        },
        focus: () => inputRef.current?.focus(),
        validate: () => runValidate(valueRef.current),
      }),
      [runValidate],
    );

    return (
      <Input
        ref={inputRef}
        useBottomSheetTextInput
        {...rest}
        value={value}
        onChangeText={handleChangeText}
        onBlur={handleBlur}
        error={error}
      />
    );
  },
);

SBottomSheetTextInput.displayName = 'SBottomSheetTextInput';

export default React.memo(SBottomSheetTextInput);
