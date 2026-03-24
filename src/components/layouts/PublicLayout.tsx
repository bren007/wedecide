import React from 'react';
import { Outlet } from 'react-router-dom';
import { Footer } from '../Footer';
import './PublicLayout.css';

export const PublicLayout: React.FC = () => {
    return (
        <div className="public-layout">
            {/* 
        The top-level Navbar manages authenticated links already. 
        If desired, could replace with a specialized marketing Navbar here. 
      */}
            <main className="public-layout-content">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};
