import React from 'react';

const Input = ({ label, name, type = 'text', value, onChange, placeholder, required, icon: Icon }) => {
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
          type={type}
          className={`w-full rounded-xl py-3 pr-4 font-sans text-base transition-all duration-200 focus:outline-none bg-input border border-border text-main placeholder-zinc-500 hover:border-border-focus/50 focus:border-primary focus:ring-4 focus:ring-primary/10 ${Icon ? 'pl-11' : 'pl-4'}`}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  );
};

export default Input;
