import { Role } from "~/src/types/employee";
import { useAuth } from "../store/auth";

export const useRole = () => {
  const { role } = useAuth.use.userInfo();
  return role;
};  

export const useRoleDriver = () => {
  const role = useRole();
  return role === Role.DRIVER;
};