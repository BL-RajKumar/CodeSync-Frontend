import React from 'react';

const Input = ({ label, name, type = 'text', value, onChange, placeholder, required, icon: Icon, isLight }) => {
  return (
    <div className="mb-5 w-full animate-fade-in">
      {label && <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-[#312e81]' : 'text-muted'}`}>{label}</label>}
      <div className="relative flex items-center">
        {Icon && <Icon className={`absolute left-4 ${isLight ? 'text-slate-400' : 'text-muted'}`} size={18} />}
        <input
          type={type}
          className={`w-full rounded-xl py-3 pr-4 font-sans text-base transition-all duration-150 focus:outline-none ${
            isLight 
              ? 'bg-white border border-indigo-200 text-slate-900 placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20' 
              : 'bg-input border border-white/10 text-main placeholder-white/20 focus:border-primary focus:ring-2 focus:ring-primary/20'
          } ${Icon ? 'pl-11' : 'pl-4'}`}
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
