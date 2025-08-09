import { useQuery } from '@tanstack/react-query';
import type { User } from '@shared/schema';

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
  });

  const isAuthenticated = !!user && !error;
  const isUnauthenticated = error?.message?.includes('Not authenticated') || error?.message?.includes('401');

  return {
    user,
    isAuthenticated,
    isUnauthenticated,
    isLoading,
  };
}