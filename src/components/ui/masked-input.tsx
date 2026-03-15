import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask: 'cpf' | 'rg' | 'telefone' | 'pis_nis' | 'cartao_sus' | 'cep';
  value?: string;
  onChange?: (value: string) => void;
  padOnBlur?: boolean;
}

// Mask patterns
const masks = {
  cpf: {
    pattern: '###.###.###-##',
    maxLength: 14,
    placeholder: '000.000.000-00',
    maxDigits: 11
  },
  rg: {
    pattern: '###.###.###-#',
    maxLength: 13,
    placeholder: '000.000.000-0',
    maxDigits: 10
  },
  telefone: {
    pattern: '(##) #####-####',
    patternFixo: '(##) ####-####',
    maxLength: 15,
    placeholder: '(00) 00000-0000',
    maxDigits: 11
  },
  pis_nis: {
    pattern: '###.#####.##-#',
    maxLength: 14,
    placeholder: '000.00000.00-0',
    maxDigits: 11
  },
  cartao_sus: {
    pattern: '### #### #### ####',
    maxLength: 18,
    placeholder: '000 0000 0000 0000',
    maxDigits: 15
  },
  cep: {
    pattern: '#####-###',
    maxLength: 9,
    placeholder: '00000-000',
    maxDigits: 8
  }
};

// Remove all non-digit characters
const unmask = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Get the appropriate pattern based on mask type and digit count
const getPattern = (maskType: keyof typeof masks, digits: string): string => {
  if (maskType === 'telefone') {
    // Phone with 10 or fewer digits uses landline format, otherwise mobile
    return digits.length <= 10 ? '(##) ####-####' : '(##) #####-####';
  }
  return masks[maskType].pattern;
};

// Apply mask to value
const applyMask = (value: string, maskType: keyof typeof masks): string => {
  const digits = unmask(value);
  const pattern = getPattern(maskType, digits);
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
  ({ mask, value = '', onChange, padOnBlur = false, className, ...props }, ref) => {
    const maskConfig = masks[mask];
    
    // Format the displayed value
    const displayValue = applyMask(value, mask);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const digits = unmask(inputValue);
      
      // Limit digits based on mask type
      const limitedDigits = digits.slice(0, maskConfig.maxDigits);
      
      // Call onChange with raw digits (without mask)
      onChange?.(limitedDigits);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Pad with leading zeros so the check digit stays in the correct position
      if (padOnBlur || mask === 'rg') {
        const digits = unmask(value);
        if (digits.length > 0 && digits.length < maskConfig.maxDigits) {
          onChange?.(digits.padStart(maskConfig.maxDigits, '0'));
        }
      }
      props.onBlur?.(e);
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
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
