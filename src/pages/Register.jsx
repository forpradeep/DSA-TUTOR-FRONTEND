import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import { setCredentials } from '../redux/authSlice';

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
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
      const res = await axiosInstance.post('/auth/register', formData);
      dispatch(setCredentials({
        user: { username: res.data.username, email: res.data.email },
        token: res.data.token
      }));
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title brand">Start your practice</h2>
        <p className="auth-sub">A tutor that asks questions, never hands you the answer.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            className="field"
            name="username"
            placeholder="Username"
            autoComplete="username"
            onChange={handleChange}
            required
          />
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
            autoComplete="new-password"
            onChange={handleChange}
            required
          />
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;