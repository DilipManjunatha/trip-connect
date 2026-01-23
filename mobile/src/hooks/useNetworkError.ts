import { useQuery } from '@tanstack/react-query';

export const useNetworkError = (queryResult: ReturnType<typeof useQuery>) => {
  const error = queryResult.error as any;
  const isNetworkError = error?.isNetworkError || 
    (!error?.response && (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK' || error?.message?.includes('Network')));
  
  return { isNetworkError, error };
};
