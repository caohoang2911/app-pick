const formatterNumber = (number: number = 0) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    parseFloat(number.toFixed(3))
  );

export const formatCurrency = (
  num: number | undefined,
  options: { unit?: boolean } = { unit: false }
) => {
  return (
    String(formatterNumber(num || 0)?.replace('₫', '') || 0) +
    `${options?.unit ? 'đ' : ''}`
  );
};

export const formatNumber = (num: number | undefined) => {
  if(!num) return 0;

  if(isFloat(num)) {
    return num.toFixed(2);
  }

  return formatterNumber(num || 0)?.replace('₫', '') || 0;
};

export const isFloat = (n: number) => {
  return Number(n) === n && n % 1 !== 0;
}

export const splitBarcode = ({
  barcode, quantity
}: {
  barcode: string,
  quantity?: number
}) => {
  let newQuantity = quantity;
  let newBarcode = barcode;

  const barcodeString = barcode?.toString().trim();

  if (barcodeString?.length === 13 && barcodeString?.startsWith("110")) {
    newBarcode = barcodeString.substring(0, 7);
    let strQuantity = Number(barcodeString.substring(7, barcodeString.length));

    newQuantity = Number(strQuantity / 10000.0);
  }

  return {
    quantity: newQuantity,
    barcode: newBarcode
  };
}

export const roundToDecimalIncrease = (value: number) => {
  const decimalsNumber = value.toString().split('.')[1]?.length || value.toString().split(',')[1]?.length || 0;
  const factor = Math.pow(10, decimalsNumber);

  return Math.round(value * factor + 1) / factor;
};

export const roundToDecimalDecrease = (value: number) => {
  const decimalsNumber = value.toString().split('.')[1]?.length || value.toString().split(',')[1]?.length || 0;
  const factor = Math.pow(10, decimalsNumber);

  return Math.round(value * factor - 1) / factor;
};


export const formatDecimal = (value: string) => {
  return value.replace(/,/g, '.');
}