import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { setCredentials } from '../redux/authSlice';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', formData);
      dispatch(setCredentials({
        user: { username: res.data.username, email: res.data.email },
        token: res.data.token
      }));
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title brand">Welcome back</h2>
        <p className="auth-sub">Log in to pick up where you left off.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            className="field"
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            onChange={handleChange}
            required
          />
          <input
            className="field"
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            onChange={handleChange}
            required
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;