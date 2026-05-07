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

export const stringUtils = {
  removeAccents,
  uppercaseFirstCharacter,
};
