import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistrationPage'; // Ensure this matches your filename (RegisterPage.tsx)

// --- PROTECTED ROUTE GUARD ---
// This component wraps any route that needs authentication.
const ProtectedLayout = () => {
    // Check if the user has a token (saved during Login/Register)
    const token = localStorage.getItem('token');

    // If no token, kick them back to the login page
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    // If token exists, render the requested page (The Outlet)
    return <Outlet />;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* --- PUBLIC ROUTES --- */}
                {/* Anyone can access these */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* --- PROTECTED ROUTES --- */}
                {/* Only logged-in users can access these */}
                <Route element={<ProtectedLayout />}>
                    <Route path="/feed" element={<FeedPage />} />
                </Route>

                {/* --- DEFAULT REDIRECT --- */}
                {/* If user goes to "/", try sending them to feed. 
            The ProtectedLayout will catch them if they aren't logged in. */}
                <Route path="/" element={<Navigate to="/feed" replace />} />

                {/* Catch-all for 404s (Optional, redirects to login) */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;