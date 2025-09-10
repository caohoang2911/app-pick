import { useLogout } from "~/src/api/auth/use-logout";
import { signOut } from "..";

export const useSignOut = () => {
  const { mutate: logout } = useLogout();
  const triggerSignOut = () => {
    logout(undefined, {
      onSuccess: (data) => {
        if(data.error) {
          return;
        }
        signOut();
      },
    });
  }

  return triggerSignOut;
};