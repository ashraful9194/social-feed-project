import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/LoginPage';
import RegistrationPage from './pages/RegistrationPage';
function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/feed" element={<FeedPage />} />
                <Route path="/registration" element={<RegistrationPage/>} />
                {/* Default redirect to login */}
                <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;