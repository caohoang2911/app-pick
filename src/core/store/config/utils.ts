import { getItem, removeItem, setItem } from '@/core/storage';

const CONFIG = 'config';
const VERSION = 'version';

export const getConfigLocalStore = () => getItem<string>(CONFIG);
export const removeConfigLocalStore = () => removeItem(CONFIG);
export const setConfigLocalStore = (value: string) => setItem<string>(CONFIG, value);

export const getVersionLocalStore = () => getItem<string>(VERSION);
export const removeVersionLocalStore = () => removeItem(CONFIG);
export const setVersionLocalStore = (value: string) => setItem<string>(VERSION, value);

