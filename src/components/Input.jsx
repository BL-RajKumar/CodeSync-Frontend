import React from 'react';

const Input = ({ label, name, type = 'text', value, onChange, placeholder, required, icon: Icon }) => {
  return (
    <div className="mb-5 w-full animate-fade-in">
      {label && <label className="block text-sm font-medium text-muted mb-2">{label}</label>}
      <div className="relative flex items-center">
        {Icon && <Icon className="absolute left-4 text-muted" size={18} />}
        <input
          type={type}
          className={`w-full bg-input border border-white/10 rounded-xl py-3 pr-4 text-main font-sans text-base transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder-white/20 ${Icon ? 'pl-11' : 'pl-4'}`}
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
