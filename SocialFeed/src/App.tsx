import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistrationPage';
import { ROUTES, STORAGE_KEYS } from './config/constants';

/**
 * Protected Route Guard
 * Wraps routes that require authentication
 */
const ProtectedLayout = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
        return <Navigate to={ROUTES.LOGIN} replace />;
    }

    return <Outlet />;
};

/**
 * Public Only Layout
 * Redirects authenticated users away from public pages
 */
const PublicOnlyLayout = () => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    if (token) {
        return <Navigate to={ROUTES.FEED} replace />;
    }
    
    return <Outlet />;
};

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route element={<PublicOnlyLayout />}>
                        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                        <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                    </Route>

                    {/* Protected Routes */}
                    <Route element={<ProtectedLayout />}>
                        <Route path={ROUTES.FEED} element={<FeedPage />} />
                    </Route>

                    {/* Default Redirect */}
                    <Route path={ROUTES.ROOT} element={<Navigate to={ROUTES.FEED} replace />} />

                    {/* 404 Catch-all */}
                    <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;