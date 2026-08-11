import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full py-4 bg-card border-t border-border text-center">
      <p className="text-muted text-xs font-semibold tracking-wide">
        &copy; {new Date().getFullYear()} CodeSync. Powered by BridgeLabz. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
