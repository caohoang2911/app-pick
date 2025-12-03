/**
 * Environment utilities and configuration
 * This file provides utilities for working with environment variables
 */

import { Env } from '~/env';

/**
 * Check if running in development mode
 */
export const isDevelopment = (): boolean => {
  return Env.IS_DEVELOPMENT;
};
