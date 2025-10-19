import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../clients/supabaseClient';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [passwordReset, setPasswordReset] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const checkResetLink = async () => {
      try {
        // Debug: Log the full URL and hash
        console.log('Full URL:', window.location.href);
        console.log('Full hash:', window.location.hash);
        console.log('Search params:', window.location.search);
        
        // Check for error in URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          let message = 'Invalid or expired reset link';
          if (errorCode === 'otp_expired') {
            message = 'Email link has expired. Please request a new password reset.';
          } else if (errorDescription) {
            message = decodeURIComponent(errorDescription);
          }
          setErrorMessage(message);
          setIsVerifying(false);
          return;
        }

        // Check for tokens in URL hash (access_token, refresh_token, type)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Access Token:', accessToken ? 'Present' : 'Missing');
        console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
        console.log('Type:', type);
        
        // Debug: Log all hash parameters
        console.log('All hash parameters:');
        for (const [key, value] of hashParams.entries()) {
          console.log(`${key}: ${value ? 'Present' : 'Missing'}`);
        }

        // Check if user is already authenticated (session exists)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('User is already authenticated:', session.user.email);
          setIsValidSession(true);
        } else if (accessToken && refreshToken && type === 'recovery') {
          // Set the session with the tokens
          try {
            const result = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            console.log('Session set result:', result);

            if (result && result.error) {
              setErrorMessage('Invalid or expired reset link');
            } else {
              setIsValidSession(true);
            }
          } catch (sessionError) {
            console.error('Session setup error:', sessionError);
            setErrorMessage('Invalid or expired reset link');
          }
        } else {
          setErrorMessage('Invalid or expired reset link');
        }
      } catch (err) {
        console.error('Error checking reset link:', err);
        setErrorMessage('Invalid or expired reset link');
      } finally {
        setIsVerifying(false);
      }
    };

    checkResetLink();
  }, [searchParams]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      console.log('Updating password...');
      
      const result = await supabase.auth.updateUser({
        password: password
      });

      console.log('Update user result:', result);

      if (result && result.error) {
        setErrorMessage(result.error.message || 'Failed to update password');
              } else {
          setPasswordReset(true);
          
          // Redirect to dashboard after 3 seconds (user is already logged in)
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 'weak', color: 'bg-red-500' };
    if (password.length < 8) return { strength: 'fair', color: 'bg-yellow-500' };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) return { strength: 'strong', color: 'bg-green-500' };
    return { strength: 'good', color: 'bg-blue-500' };
  };

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Show error if session is not valid
  if (!isValidSession || errorMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center p-8">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Invalid Reset Link
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'The password reset link is invalid or has expired.'}
            </p>
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Show success after password reset
  if (passwordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center p-8">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your password has been updated successfully. You will be redirected to the dashboard shortly.
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(password);

  // Show password reset form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Reset Password
            </h2>
            <p className="text-gray-600">
              Enter your new password below
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  required
                  disabled={loading}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {password && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Password strength:</span>
                    <span className="capitalize">{passwordStrength.strength}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ 
                        width: password.length < 6 ? '25%' : 
                               password.length < 8 ? '50%' : 
                               password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/) ? '100%' : '75%' 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  required
                  disabled={loading}
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResetPasswordPage; 