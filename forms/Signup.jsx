import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Input from '../components/input';
import Button from '../components/button';

function Signup() {
  const navigate = useNavigate();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const signupHandler = async (data) => {
    setError('');
    setSuccessMessage(`Demo: Account created for ${data.email}. You can now log in.`);
    setTimeout(() => navigate('/auth/login'), 2500);
  };

  return (
    <div className="auth-container">
      <div className="auth-overlay"></div>

      <div className="auth-card">
        <h2 className="auth-title">Create Account</h2>

        <p className="auth-subtitle">
          Already have an account?{' '}
          <span
            className="auth-link"
            style={{ cursor: 'pointer', color: 'blue' }}
            onClick={() => navigate('/auth/login')}
          >
            Sign In
          </span>
        </p>

        {error && <div className="auth-error">{error}</div>}
        {successMessage && (
          <div className="auth-success" style={{
            backgroundColor: '#d4edda',
            color: '#155724',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            border: '1px solid #c3e6cb'
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(signupHandler)} className="auth-form">
          <div className="form-fields">
            <Input
              label="Full Name"
              type="text"
              placeholder="Enter your full name"
              className="auth-input"
              error={errors.name?.message}
              {...register('name', { required: 'Full name is required' })}
            />

            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              className="auth-input"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              className="auth-input"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
            />
          </div>

          <Button type="submit" className="auth-button" disabled={isSubmitting}>
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </Button>

          <p className="auth-note" style={{ fontSize: '12px', marginTop: '10px' }}>
            <strong>Note:</strong> After signing up, you'll receive a verification email.
            You must click the link in that email to fully activate your account.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Signup;