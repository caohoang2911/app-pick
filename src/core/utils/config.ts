import { Option, Options } from "~/src/types/commons";

const getConfigNameById = (options: Options, id?: string | number) => {
  return options?.find((option: Option) => option.id === id)?.name;
};

const findConfigByName = (options: Options, name?: string | number): any => {
  return options?.find((option: Option) => option.name === name)?.id;
};

const findConfigItem = (options: Options, id?: string | number) => {
  return options?.find((option: Option) => option.id === id);
};

export { getConfigNameById, findConfigByName, findConfigItem };
