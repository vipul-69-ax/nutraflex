import { useState, useCallback } from 'react';
import { validateEmail, validatePassword, validateName } from '@/lib/validation';

type FormFields = {
  email: string;
  password: string;
  name?: string;
};

type FormErrors = {
  email?: string;
  password?: string;
  name?: string;
};

export const useForm = (isSignupMode: boolean) => {
  const [fields, setFields] = useState<FormFields>({ email: '', password: '', name: '' });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};

    if (!validateEmail(fields.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!validatePassword(fields.password)) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (isSignupMode && !validateName(fields.name || '')) {
      newErrors.name = 'Please enter your name';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, isSignupMode]);

  const handleChange = useCallback((name: keyof FormFields, value: string) => {
    setFields(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }, []);

  return { fields, errors, handleChange, validateForm };
};

