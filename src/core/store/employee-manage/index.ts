import { create } from 'zustand';
import { createSelectors } from '../../utils/browser';

// Employee type definition - aligned with API
export interface Employee {
  id: number;
  employeeId: string; // username from API
  name: string;
  role: string;
  status: string;
  storeCode: string;
  fcmToken?: string;
  tenants: string[];
  createdTime: number;
  lastAccessedTime: number;
}

// Action menu item type
export interface ActionMenuItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface EmployeeManageState {
  // State
  employees: Employee[];
  searchQuery: string;
  selectedEmployee: Employee | null;
  
  // Modal states
  actionMenuVisible: boolean;
  addEmployeeModalVisible: boolean;
  inviteBottomSheetVisible: boolean;
  
  // Actions
  setEmployees: (employees: Employee[]) => void;
  addEmployee: (employee: Employee) => void;
  removeEmployee: (employeeId: number) => void;
  updateEmployee: (employeeId: number, updates: Partial<Employee>) => void;
  
  // Search
  setSearchQuery: (query: string) => void;
  getFilteredEmployees: () => Employee[];
  
  // Employee selection
  setSelectedEmployee: (employee: Employee | null) => void;
  
  // Modal controls
  setActionMenuVisible: (visible: boolean) => void;
  setAddEmployeeModalVisible: (visible: boolean) => void;
  setInviteBottomSheetVisible: (visible: boolean) => void;
  
  // Reset
  reset: () => void;
}

const _useEmployeeManage = create<EmployeeManageState>((set, get) => ({
  // Initial state
  employees: [],
  searchQuery: '',
  selectedEmployee: null,
  actionMenuVisible: false,
  addEmployeeModalVisible: false,
  inviteBottomSheetVisible: false,

  // Employee actions
  setEmployees: (employees: Employee[]) => {
    set({ employees });
  },

  addEmployee: (employee: Employee) => {
    set((state) => ({
      employees: [...state.employees, employee]
    }));
  },

  removeEmployee: (employeeId: number) => {
    set((state) => ({
      employees: state.employees.filter(emp => emp.id !== employeeId)
    }));
  },

  updateEmployee: (employeeId: number, updates: Partial<Employee>) => {
    set((state) => ({
      employees: state.employees.map(emp => 
        emp.id === employeeId ? { ...emp, ...updates } : emp
      )
    }));
  },

  // Search
  setSearchQuery: (searchQuery: string) => {
    set({ searchQuery });
  },

  getFilteredEmployees: () => {
    const { employees, searchQuery } = get();
    if (!searchQuery.trim()) return employees;
    
    return employees.filter(employee =>
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  },

  // Employee selection
  setSelectedEmployee: (selectedEmployee: Employee | null) => {
    set({ selectedEmployee });
  },



  // Modal controls
  setActionMenuVisible: (actionMenuVisible: boolean) => {
    set({ actionMenuVisible });
  },

  setAddEmployeeModalVisible: (addEmployeeModalVisible: boolean) => {
    set({ addEmployeeModalVisible });
  },

  setInviteBottomSheetVisible: (inviteBottomSheetVisible: boolean) => {
    set({ inviteBottomSheetVisible });
  },

  // Reset
  reset: () => {
    set({
      employees: [],
      searchQuery: '',
      selectedEmployee: null,
      actionMenuVisible: false,
      addEmployeeModalVisible: false,
      inviteBottomSheetVisible: false,
    });
  },
}));

export const useEmployeeManage = createSelectors(_useEmployeeManage);

// Export individual actions for direct access
export const setEmployees = (employees: Employee[]) =>
  _useEmployeeManage.getState().setEmployees(employees);

export const addEmployee = (employee: Employee) =>
  _useEmployeeManage.getState().addEmployee(employee);

export const removeEmployee = (employeeId: number) =>
  _useEmployeeManage.getState().removeEmployee(employeeId);

export const updateEmployee = (employeeId: number, updates: Partial<Employee>) =>
  _useEmployeeManage.getState().updateEmployee(employeeId, updates);

export const setSearchQuery = (searchQuery: string) =>
  _useEmployeeManage.getState().setSearchQuery(searchQuery);

export const setSelectedEmployee = (selectedEmployee: Employee | null) =>
  _useEmployeeManage.getState().setSelectedEmployee(selectedEmployee);

export const setActionMenuVisible = (actionMenuVisible: boolean) =>
  _useEmployeeManage.getState().setActionMenuVisible(actionMenuVisible);

export const setAddEmployeeModalVisible = (addEmployeeModalVisible: boolean) =>
  _useEmployeeManage.getState().setAddEmployeeModalVisible(addEmployeeModalVisible);

export const setInviteBottomSheetVisible = (inviteBottomSheetVisible: boolean) =>
  _useEmployeeManage.getState().setInviteBottomSheetVisible(inviteBottomSheetVisible);

export const reset = () => _useEmployeeManage.getState().reset(); 