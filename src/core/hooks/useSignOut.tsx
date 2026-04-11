import { useLogout } from '~/src/api/auth/use-logout';

export const useSignOut = () => {
  const { mutate: logout } = useLogout();
  const triggerSignOut = () => {
    logout();
  };

  return triggerSignOut;
};
