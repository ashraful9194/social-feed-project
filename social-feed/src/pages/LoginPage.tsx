import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService'; // Ensure filename matches exactly (case sensitive)

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Call the Real API
            const data = await authService.login({ email, password });

            // 2. Save Token & User Info
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ name: data.fullName, email: data.email }));

            // 3. Redirect to Feed
            navigate('/feed');
        } catch (err: any) {
            console.error(err);
            // Safely extract error message from API response if available
            const errorMessage = err.response?.data || 'Login failed. Please check your credentials.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="_social_login_wrapper _layout_main_wrapper">
            {/* Background Shapes */}
            <div className="_shape_one">
                <img src="/assets/images/shape1.svg" alt="" className="_shape_img" />
                <img src="/assets/images/dark_shape.svg" alt="" className="_dark_shape" />
            </div>
            <div className="_shape_two">
                <img src="/assets/images/shape2.svg" alt="" className="_shape_img" />
                <img src="/assets/images/dark_shape1.svg" alt="" className="_dark_shape _dark_shape_opacity" />
            </div>
            <div className="_shape_three">
                <img src="/assets/images/shape3.svg" alt="" className="_shape_img" />
                <img src="/assets/images/dark_shape2.svg" alt="" className="_dark_shape _dark_shape_opacity" />
            </div>

            <div className="_social_login_wrap">
                <div className="container">
                    <div className="row align-items-center">
                        {/* Left Side Image */}
                        <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                            <div className="_social_login_left">
                                <div className="_social_login_left_image">
                                    <img src="/assets/images/login.png" alt="Login Illustration" className="_left_img" />
                                </div>
                            </div>
                        </div>

                        {/* Right Side Form */}
                        <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                            <div className="_social_login_content">
                                <div className="_social_login_left_logo _mar_b28">
                                    <img src="/assets/images/logo.svg" alt="Logo" className="_left_logo" />
                                </div>
                                <p className="_social_login_content_para _mar_b8">Welcome back</p>
                                <h4 className="_social_login_content_title _titl4 _mar_b50">Login to your account</h4>


                                {/* ERROR MESSAGE DISPLAY */}
                                {error && (
                                    <div className="alert alert-danger _mar_b14" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form className="_social_login_form" onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                                            <div className="_social_login_form_input _mar_b14">
                                                <label className="_social_login_label _mar_b8">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-control _social_login_input"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                                            <div className="_social_login_form_input _mar_b14">
                                                <label className="_social_login_label _mar_b8">Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control _social_login_input"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-lg-6 col-xl-6 col-md-6 col-sm-12">
                                            <div className="form-check _social_login_form_check">
                                                <input
                                                    className="form-check-input _social_login_form_check_input"
                                                    type="checkbox" // Changed to checkbox
                                                    id="flexRadioDefault2"
                                                />
                                                <label className="form-check-label _social_login_form_check_label" htmlFor="flexRadioDefault2">
                                                    Remember me
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                                            <div className="_social_login_form_btn _mar_t40 _mar_b60">
                                                <button
                                                    type="submit"
                                                    className="_social_login_form_btn_link _btn1"
                                                    disabled={loading}
                                                    style={{ width: '100%', border: 'none' }}
                                                >
                                                    {loading ? 'Logging in...' : 'Login now'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>

                                <div className="row">
                                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                                        <div className="_social_login_bottom_txt">
                                            <p className="_social_login_bottom_txt_para">
                                                Dont have an account? <Link to="/register">Create New Account</Link>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Login;