import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface StudentFormContextType {
  // Form registrations
  headerForm: UseFormReturn<any> | null;
  basicDataForm: UseFormReturn<any> | null;
  workForm: UseFormReturn<any> | null;
  healthForm: UseFormReturn<any> | null;
  
  // Register functions
  registerHeaderForm: (form: UseFormReturn<any>) => void;
  registerBasicDataForm: (form: UseFormReturn<any>) => void;
  registerWorkForm: (form: UseFormReturn<any>) => void;
  registerHealthForm: (form: UseFormReturn<any>) => void;
  
  // Save functions from tabs
  registerBasicDataSave: (fn: () => Promise<boolean>) => void;
  registerWorkSave: (fn: () => Promise<boolean>) => void;
  registerHealthSave: (fn: () => Promise<boolean>) => void;
  
  // State
  isSaving: boolean;
  studentId: string | null;
  setStudentId: (id: string | null) => void;
  
  // Actions
  saveAll: () => Promise<boolean>;
}

const StudentFormContext = createContext<StudentFormContextType | null>(null);

export function useStudentFormContext() {
  const context = useContext(StudentFormContext);
  if (!context) {
    throw new Error('useStudentFormContext must be used within StudentFormProvider');
  }
  return context;
}

interface StudentFormProviderProps {
  children: React.ReactNode;
  initialStudentId?: string | null;
}

export function StudentFormProvider({ children, initialStudentId = null }: StudentFormProviderProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(initialStudentId);
  
  // Form refs
  const headerFormRef = useRef<UseFormReturn<any> | null>(null);
  const basicDataFormRef = useRef<UseFormReturn<any> | null>(null);
  const workFormRef = useRef<UseFormReturn<any> | null>(null);
  const healthFormRef = useRef<UseFormReturn<any> | null>(null);
  
  // Save function refs
  const basicDataSaveRef = useRef<(() => Promise<boolean>) | null>(null);
  const workSaveRef = useRef<(() => Promise<boolean>) | null>(null);
  const healthSaveRef = useRef<(() => Promise<boolean>) | null>(null);
  
  // Register functions
  const registerHeaderForm = useCallback((form: UseFormReturn<any>) => {
    headerFormRef.current = form;
  }, []);
  
  const registerBasicDataForm = useCallback((form: UseFormReturn<any>) => {
    basicDataFormRef.current = form;
  }, []);
  
  const registerWorkForm = useCallback((form: UseFormReturn<any>) => {
    workFormRef.current = form;
  }, []);
  
  const registerHealthForm = useCallback((form: UseFormReturn<any>) => {
    healthFormRef.current = form;
  }, []);
  
  // Register save functions
  const registerBasicDataSave = useCallback((fn: () => Promise<boolean>) => {
    basicDataSaveRef.current = fn;
  }, []);
  
  const registerWorkSave = useCallback((fn: () => Promise<boolean>) => {
    workSaveRef.current = fn;
  }, []);
  
  const registerHealthSave = useCallback((fn: () => Promise<boolean>) => {
    healthSaveRef.current = fn;
  }, []);
  
  // Save all forms
  const saveAll = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    
    try {
      // 1. Validate all forms first
      const headerValid = headerFormRef.current ? await headerFormRef.current.trigger() : true;
      const basicValid = basicDataFormRef.current ? await basicDataFormRef.current.trigger() : true;
      const workValid = workFormRef.current ? await workFormRef.current.trigger() : true;
      const healthValid = healthFormRef.current ? await healthFormRef.current.trigger() : true;
      
      if (!headerValid || !basicValid || !workValid || !healthValid) {
        return false;
      }
      
      // 2. Save secondary forms in parallel (they depend on studentId already existing)
      if (studentId) {
        const savePromises: Promise<boolean>[] = [];
        
        if (basicDataSaveRef.current) {
          savePromises.push(basicDataSaveRef.current());
        }
        if (workSaveRef.current) {
          savePromises.push(workSaveRef.current());
        }
        if (healthSaveRef.current) {
          savePromises.push(healthSaveRef.current());
        }
        
        const results = await Promise.all(savePromises);
        const allSuccessful = results.every(r => r);
        
        return allSuccessful;
      }
      
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [studentId]);
  
  const value: StudentFormContextType = {
    headerForm: headerFormRef.current,
    basicDataForm: basicDataFormRef.current,
    workForm: workFormRef.current,
    healthForm: healthFormRef.current,
    registerHeaderForm,
    registerBasicDataForm,
    registerWorkForm,
    registerHealthForm,
    registerBasicDataSave,
    registerWorkSave,
    registerHealthSave,
    isSaving,
    studentId,
    setStudentId,
    saveAll,
  };
  
  return (
    <StudentFormContext.Provider value={value}>
      {children}
    </StudentFormContext.Provider>
  );
}
