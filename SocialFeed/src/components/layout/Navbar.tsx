import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Navbar: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { getUser, getUserAvatar, logout } = useAuth();
    const currentUser = getUser();
    const currentUserAvatar = getUserAvatar();

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            {/* Desktop Navbar (Hidden on mobile) */}
            <nav className="navbar navbar-expand-lg navbar-light _header_nav _padd_t10">
                <div className="container _custom_container">
                    <div className="_logo_wrap">
                        <Link className="navbar-brand" to="/feed">
                            <img src="assets/images/logo.svg" alt="Logo" className="_nav_logo" />
                        </Link>
                    </div>

                    <div className="navbar-collapse" id="navbarSupportedContent">
                        <div className="_header_form ms-auto">
                            <form className="_header_form_grp">
                                <svg className="_header_form_svg" xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="none" viewBox="0 0 17 17">
                                    <circle cx="7" cy="7" r="6" stroke="#666" />
                                    <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3" />
                                </svg>
                                <input className="form-control me-2 _inpt1" type="search" placeholder="input search text" aria-label="Search" />
                            </form>
                        </div>

                        <ul className="navbar-nav mb-2 mb-lg-0 _header_nav_list ms-auto _mar_r8">
                            <li className="nav-item _header_nav_item">
                                <Link className="nav-link _header_nav_link_active _header_nav_link" to="/feed">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="21" fill="none" viewBox="0 0 18 21"><path className="_home_active" stroke="#000" strokeWidth="1.5" strokeOpacity=".6" d="M1 9.924c0-1.552 0-2.328.314-3.01.313-.682.902-1.187 2.08-2.196l1.143-.98C6.667 1.913 7.732 1 9 1c1.268 0 2.333.913 4.463 2.738l1.142.98c1.179 1.01 1.768 1.514 2.081 2.196.314.682.314 1.458.314 3.01v4.846c0 2.155 0 3.233-.67 3.902-.669.67-1.746.67-3.901.67H5.57c-2.155 0-3.232 0-3.902-.67C1 18.002 1 16.925 1 14.77V9.924z" /><path className="_home_active" stroke="#000" strokeOpacity=".6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.857 19.341v-5.857a1 1 0 00-1-1H7.143a1 1 0 00-1 1v5.857" /></svg>
                                </Link>
                            </li>
                        </ul>

                        <div className="_header_nav_profile" style={{ display: 'flex', alignItems: 'center' }}>
                            <div className="_header_nav_profile_image">
                                <img src={currentUserAvatar} alt={currentUser?.name ?? 'Profile'} className="_nav_profile_img" />
                            </div>

                            <div className="_header_nav_dropdown" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <p className="_header_nav_para" style={{ margin: 0, paddingRight: '10px' }}>
                                    {currentUser?.name ?? 'User'}
                                </p>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    style={{
                                        border: '1px solid #e1e1e1',
                                        background: '#fff',
                                        color: '#dc3545',
                                        borderRadius: '4px',
                                        padding: '5px 12px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navbar (Shows on mobile) */}
            <div className="_header_mobile_menu">
                <div className="container _custom_container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                        {/* Logo */}
                        <Link to="/feed">
                            <img src="assets/images/logo.svg" alt="Logo" style={{ height: '32px' }} />
                        </Link>

                        {/* Hamburger Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '8px'
                            }}
                            aria-label="Menu"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M3 12H21" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                                <path d="M3 6H21" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                                <path d="M3 18H21" stroke="#000" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>

                    {/* Mobile Menu Dropdown */}
                    {isMobileMenuOpen && (
                        <div style={{
                            background: '#fff',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            padding: '16px',
                            marginBottom: '12px'
                        }}>
                            {/* Profile Section */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                paddingBottom: '12px',
                                borderBottom: '1px solid #e5e5e5'
                            }}>
                                <img
                                    src={currentUserAvatar}
                                    alt={currentUser?.name ?? 'Profile'}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        objectFit: 'cover'
                                    }}
                                />
                                <span style={{ fontSize: '15px', fontWeight: 500 }}>
                                    {currentUser?.name ?? 'User'}
                                </span>
                            </div>

                            {/* Logout Button */}
                            <button
                                type="button"
                                onClick={handleLogout}
                                style={{
                                    width: '100%',
                                    marginTop: '12px',
                                    border: '1px solid #e1e1e1',
                                    background: '#fff',
                                    color: '#dc3545',
                                    borderRadius: '6px',
                                    padding: '10px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer'
                                }}
                            >
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Navbar;