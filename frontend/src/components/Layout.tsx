import React from 'react';
import NavBar from './Navbar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <NavBar />
       <main style={{ paddingTop: '0px', marginTop: '0px' }}>{children}</main>
    </>
  );
};

export default Layout;