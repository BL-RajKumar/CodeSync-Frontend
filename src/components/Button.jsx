import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', fullWidth, disabled }) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-base transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-white shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] hover:bg-primary-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)]",
    secondary: "bg-white/5 text-main border border-white/10 hover:bg-white/10",
    danger: "bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
};

export default Button;
