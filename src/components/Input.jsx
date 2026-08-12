import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({ label, name, type = 'text', value, onChange, placeholder, required, icon: Icon }) => {
  const [showPassword, setShowPassword] = useState(false);
  
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="mb-5 w-full animate-fade-in group">
      {label && (
        <label className="block text-sm font-semibold mb-2 text-muted transition-colors duration-200 group-focus-within:text-primary">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <Icon 
            className="absolute left-4 text-muted transition-colors duration-200 group-focus-within:text-primary" 
            size={18} 
          />
        )}
        <input
          type={inputType}
          className={`w-full rounded-xl py-3 font-sans text-base transition-all duration-200 focus:outline-none bg-input border border-border text-main placeholder-zinc-500 hover:border-border-focus/50 focus:border-primary focus:ring-4 focus:ring-primary/10 ${Icon ? 'pl-11' : 'pl-4'} ${isPassword ? 'pr-11' : 'pr-4'}`}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute right-4 text-muted hover:text-primary transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
