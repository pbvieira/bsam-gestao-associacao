import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: 'cpf' | 'rg';
  value?: string;
  onChange?: (value: string) => void;
}

// Mask patterns
const masks = {
  cpf: {
    pattern: '###.###.###-##',
    maxLength: 14,
    placeholder: '000.000.000-00'
  },
  rg: {
    pattern: '##.###.###-#',
    maxLength: 12,
    placeholder: '00.000.000-0'
  }
};

// Remove all non-digit characters
const unmask = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Apply mask to value
const applyMask = (value: string, pattern: string): string => {
  const digits = unmask(value);
  let result = '';
  let digitIndex = 0;
  
  for (let i = 0; i < pattern.length && digitIndex < digits.length; i++) {
    if (pattern[i] === '#') {
      result += digits[digitIndex];
      digitIndex++;
    } else {
      result += pattern[i];
    }
  }
  
  return result;
};

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value = '', onChange, className, ...props }, ref) => {
    const maskConfig = masks[mask];
    
    // Format the displayed value
    const displayValue = applyMask(value, maskConfig.pattern);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const digits = unmask(inputValue);
      
      // CPF has max 11 digits, RG has max 9 digits
      const maxDigits = mask === 'cpf' ? 11 : 9;
      const limitedDigits = digits.slice(0, maxDigits);
      
      // Call onChange with raw digits (without mask)
      onChange?.(limitedDigits);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        maxLength={maskConfig.maxLength}
        placeholder={props.placeholder || maskConfig.placeholder}
        className={cn(className)}
        {...props}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';

export { MaskedInput };
