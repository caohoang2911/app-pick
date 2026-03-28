import type { Config } from '~/src/types/config';

export type ConfigResponse = {
  allConfig?: Config | null;
  version?: string;
};
