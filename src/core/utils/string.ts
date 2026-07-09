import { toLower, toUpper } from 'lodash';

const removeAccents = (str?: string) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
};

const uppercaseFirstCharacter = (str?: string) => {
  if (!str) return '';
  return toUpper(str.charAt(0)) + toLower(str.slice(1));
};

/** Chữ trên avatar: chữ cái đầu của 2 từ cuối (tên gọi trong tên tiếng Việt), vd "Nguyễn Thị Tuyết Giang" → "TG". */
const getInitials = (name?: string) => {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (!words.length) return '?';
  return words
    .slice(-2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

export const stringUtils = {
  removeAccents,
  uppercaseFirstCharacter,
  getInitials,
};
