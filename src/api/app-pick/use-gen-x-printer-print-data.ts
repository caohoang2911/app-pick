import { useMutation } from '@tanstack/react-query';
import { axiosClient } from '../shared/client';

type Variables = {
  base64Image: string;
};

type Response = {
  data: Uint8Array;
  error?: string;
  hasError?: boolean;
};

const genXPrinterPrintData = async (base64Image: string): Promise<Response> => {
  return await axiosClient.post<Uint8Array>('app-pick/genXPrinterPrintData', {
    base64Image: base64Image,
  });
};

export const useGenXPrinterPrintData = () => {
  return useMutation({
    mutationFn: (params: Variables) => genXPrinterPrintData(params.base64Image),
  });
};
