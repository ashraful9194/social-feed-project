import React, { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/AuthService'; // Ensure case sensitivity (authService.ts)

const Registration: React.FC = () => {
    const navigate = useNavigate();

    // State for form inputs
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [repeatPassword, setRepeatPassword] = useState('');
    const [agreed, setAgreed] = useState(false); // Default false
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    const passwordCriteria = [
        { label: 'At least 8 characters', met: hasMinLength },
        { label: 'One uppercase letter', met: hasUppercase },
        { label: 'One lowercase letter', met: hasLowercase },
        { label: 'One number', met: hasNumber },
        { label: 'One special character', met: hasSpecial }
    ];

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!emailPattern.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        if (password !== repeatPassword) {
            setError("Passwords do not match!");
            return;
        }

        if (!agreed) {
            setError("You must agree to the terms and conditions.");
            return;
        }

        setLoading(true);

        try {
            // 1. Call the Real API
            const data = await authService.register({
                firstName,
                lastName,
                email,
                password
            });

            // 2. Save Token & User Info (Auto-login)
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ name: data.fullName, email: data.email }));

            // 3. Redirect to Feed
            navigate('/feed');
        } catch (err: any) {
            console.error(err);
            const errorMessage = err.response?.data || 'Registration failed. Please try again.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="_social_registration_wrapper _layout_main_wrapper">
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

            <div className="_social_registration_wrap">
                <div className="container">
                    <div className="row align-items-center">
                        {/* Left Side Images */}
                        <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                            <div className="_social_registration_right">
                                <div className="_social_registration_right_image">
                                    <img src="/assets/images/registration.png" alt="Registration Illustration" />
                                </div>
                                <div className="_social_registration_right_image_dark">
                                    <img src="/assets/images/registration1.png" alt="Registration Dark Mode" />
                                </div>
                            </div>
                        </div>

                        {/* Right Side Form */}
                        <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                            <div className="_social_registration_content">
                                <div className="_social_registration_right_logo _mar_b28">
                                    <img src="/assets/images/logo.svg" alt="Logo" className="_right_logo" />
                                </div>
                                <p className="_social_registration_content_para _mar_b8">Get Started Now</p>
                                <h4 className="_social_registration_content_title _titl4 _mar_b50">Registration</h4>


                                {/* ERROR MESSAGE */}
                                {error && (
                                    <div className="alert alert-danger _mar_b14" role="alert">
                                        {error}
                                    </div>
                                )}

                                <form className="_social_registration_form" onSubmit={handleSubmit}>
                                    <div className="row">
                                        {/* First Name Field */}
                                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                                            <div className="_social_registration_form_input _mar_b14">
                                                <label className="_social_registration_label _mar_b8">First Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control _social_registration_input"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        {/* Last Name Field */}
                                        <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12">
                                            <div className="_social_registration_form_input _mar_b14">
                                                <label className="_social_registration_label _mar_b8">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control _social_registration_input"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                                            <div className="_social_registration_form_input _mar_b14">
                                                <label className="_social_registration_label _mar_b8">Email</label>
                                                <input
                                                    type="email"
                                                    className="form-control _social_registration_input"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                    pattern={emailPattern.source}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                                            <div className="_social_registration_form_input _mar_b14">
                                                <label className="_social_registration_label _mar_b8">Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control _social_registration_input"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                                            <div className="_social_registration_form_input _mar_b14">
                                                <label className="_social_registration_label _mar_b8">Repeat Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control _social_registration_input"
                                                    value={repeatPassword}
                                                    onChange={(e) => setRepeatPassword(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                                            <ul className="_password_requirements" style={{ listStyle: 'none', paddingLeft: 0, marginTop: 10, marginBottom: 20 }}>
                                                {passwordCriteria.map((criterion) => (
                                                    <li
                                                        key={criterion.label}
                                                        style={{
                                                            color: criterion.met ? '#2e7d32' : '#000',
                                                            fontSize: '0.9rem',
                                                            marginBottom: 4,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                width: 10,
                                                                height: 10,
                                                                borderRadius: '50%',
                                                                backgroundColor: criterion.met ? '#2e7d32' : '#999',
                                                                display: 'inline-block'
                                                            }}
                                                        ></span>
                                                        {criterion.label}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-lg-12 col-xl-12 col-md-12 col-sm-12">
                                            <div className="form-check _social_registration_form_check">
                                                <input
                                                    className="form-check-input _social_registration_form_check_input"
                                                    type="checkbox" // Checkbox is appropriate here
                                                    id="flexRadioDefault2"
                                                    checked={agreed}
                                                    onChange={() => setAgreed(!agreed)}
                                                />
                                                <label className="form-check-label _social_registration_form_check_label" htmlFor="flexRadioDefault2">
                                                    I agree to terms & conditions
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-lg-12 col-md-12 col-xl-12 col-sm-12">
                                            <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                                                <button
                                                    type="submit"
                                                    className="_social_registration_form_btn_link _btn1"
                                                    style={{ whiteSpace: 'nowrap', width: '100%', border: 'none' }}
                                                    disabled={loading}
                                                >
                                                    {loading ? 'Registering...' : 'Register now'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </form>

                                <div className="row">
                                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12">
                                        <div className="_social_registration_bottom_txt">
                                            <p className="_social_registration_bottom_txt_para">
                                                Already have an account? <Link to="/login">Login</Link>
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

export default Registration;