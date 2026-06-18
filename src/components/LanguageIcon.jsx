import React from 'react';

export const getLanguageLabel = (lang) => {
  if (!lang) return '';
  const langLower = lang.toLowerCase().trim();
  switch (langLower) {
    case 'react':
      return 'React';
    case 'javascript':
    case 'js':
      return 'JavaScript';
    case 'node-web':
    case 'node':
      return 'Node.js';
    case 'python':
      return 'Python';
    case 'java':
      return 'Java';
    case 'cpp':
    case 'c++':
      return 'C++';
    case 'go':
    case 'golang':
      return 'Go';
    case 'ruby':
      return 'Ruby';
    case 'vanilla-web':
    case 'html':
      return 'Vanilla HTML/CSS/JS';
    default:
      return lang.charAt(0).toUpperCase() + lang.slice(1);
  }
};

export const LanguageIcon = ({ language, className = "w-4 h-4" }) => {
  const lang = (language || '').toLowerCase().trim();

  switch (lang) {
    case 'react':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="2" fill="#00D8FF"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#00D8FF" strokeWidth="1.5"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" stroke="#00D8FF" strokeWidth="1.5"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" stroke="#00D8FF" strokeWidth="1.5"/>
        </svg>
      );
    case 'javascript':
    case 'js':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="24" height="24" rx="4" fill="#F7DF1E"/>
          <path d="M11.5 10H10V15C10 16.5 9 17 8 17C7.2 17 6.5 16.5 6.5 15.5L7.75 15.4C7.8 15.8 8.1 16 8.5 16C9 16 9.1 15.5 9.1 14.8V10H11.5ZM17 11.5C17 10.5 16.2 10 15 10C13.8 10 13 10.6 13 11.8C13 14 17 13.5 17 15C17 15.6 16.5 16 15.5 16C14.5 16 14.1 15.4 14 14.6L12.75 14.8C12.9 16.2 14 17 15.5 17C17 17 18.25 16.1 18.25 14.8C18.25 12.5 14.25 13 14.25 11.8C14.25 11.3 14.7 11 15.25 11C15.8 11 16.2 11.3 16.25 11.8L17 11.5Z" fill="#000000"/>
        </svg>
      );
    case 'node':
    case 'node-web':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L4.5 6.3V15L12 19.3L19.5 15V6.3L12 2Z" stroke="#339933" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M12 6.5V17" stroke="#339933" strokeWidth="2"/>
          <path d="M7 8L12 11L17 8" stroke="#339933" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    case 'python':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.9 2C9 2 8.3 3.2 8.3 4.8V6.8H12V7.3H6.8C5.2 7.3 4 8 4 10.9C4 13.8 4.9 14.7 6.5 14.7H8V13C8 10.9 9.3 9.6 11.4 9.6H16.6C18.2 9.6 19.4 8.9 19.4 6C19.4 3.1 18.2 2 15.3 2H11.9Z" fill="#3776AB"/>
          <path d="M12.1 22C15 22 15.7 20.8 15.7 19.2V17.2H12V16.7H17.2C18.8 16.7 20 16 20 13.1C20 10.2 19.1 9.3 17.5 9.3H16V11C16 13.1 14.7 14.4 12.6 14.4H7.4C5.8 14.4 4.6 15.1 4.6 18C4.6 20.9 5.8 22 8.7 22H12.1Z" fill="#FFD343"/>
          <circle cx="10" cy="4.5" r="0.8" fill="#FFF"/>
          <circle cx="14" cy="19.5" r="0.8" fill="#FFF"/>
        </svg>
      );
    case 'java':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 17C6 17 8 16 9.5 14.5" stroke="#EA2D2E" strokeWidth="2" strokeLinecap="round"/>
          <path d="M5 19.5C7.5 19.5 10 18 11.5 16" stroke="#EA2D2E" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14.5 10C16 11.5 18 11.5 19.5 10.5C21 9.5 21 8.5 21.5 7" stroke="#0073B7" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M6 13C6.5 12 7.5 11 9 10C11.5 8.5 13.5 8.5 15.5 10.5C17.5 12.5 15.5 15 12.5 15C10 15 8 14 6 13Z" fill="#0073B7" opacity="0.8"/>
          <path d="M9 3C9.5 4 9.5 5 9 6" stroke="#EA2D2E" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M11.5 2.5C12 3.5 12 4.5 11.5 5.5" stroke="#EA2D2E" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    case 'cpp':
    case 'c++':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4C7.6 4 4 7.6 4 12C4 16.4 7.6 20 12 20C15 20 17.6 18.3 19 15.8L16.5 14.3C15.7 15.7 14 16.5 12 16.5C9.5 16.5 7.5 14.5 7.5 12C7.5 9.5 9.5 7.5 12 7.5C14 7.5 15.7 8.3 16.5 9.7L19 8.2C17.6 5.7 15 4 12 4Z" fill="#00599C"/>
          <path d="M18.5 11H21.5M20 9.5V12.5" stroke="#00599C" strokeWidth="2" strokeLinecap="round"/>
          <path d="M22 14.5H25M23.5 13V16" stroke="#00599C" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    case 'go':
    case 'golang':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.5 10.5C14.5 8.5 13.5 7 11.5 7C9.5 7 7.5 9 7.5 12C7.5 15 9.5 17 11.5 17C13.5 17 14.5 15.5 14.5 13.5H11.5V11.5H17.5V13.5C17.5 16.5 15.5 19 11.5 19C7.5 19 4.5 16 4.5 12C4.5 8 7.5 5 11.5 5C15.5 5 17.5 7.5 17.5 10.5H14.5Z" fill="#00ADD8"/>
        </svg>
      );
    case 'ruby':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 3L2 9L12 21L22 9L18 3H6Z" fill="#CC342D"/>
          <path d="M6 3L12 9L18 3H6Z" fill="#E1574E"/>
          <path d="M2 9L12 21L12 9L2 9Z" fill="#9B1B15"/>
          <path d="M22 9L12 21L12 9L22 9Z" fill="#E1574E"/>
          <path d="M6 3H12V9L6 3Z" fill="#F38C84"/>
        </svg>
      );
    case 'vanilla-web':
    case 'html':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.5 3L5.5 18.5L12 21L18.5 18.5L19.5 3H4.5Z" fill="#E34F26"/>
          <path d="M12 4.5V19.5L17 17.5L17.8 5.5H12V4.5Z" fill="#EF652A"/>
          <path d="M12 8.5H9.2L9.4 10.5H12V12.5H9.6L9.8 15L12 15.6V17.5L8 16.2L7.4 7.2H12V8.5Z" fill="#EFEFEF"/>
          <path d="M12 8.5H15.8L15.4 12.5H12V14.5H14.8L14.4 16.2L12 17.2V19L16 17.5L17 5.5H12V8.5Z" fill="#FFF"/>
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 22 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#9CA3AF"/>
        </svg>
      );
  }
};
