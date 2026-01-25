import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  CssBaseline,
  Avatar,
  Grid,
  Link,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  // Эффект для перенаправления при изменении пользователя
  useEffect(() => {
    console.log('[LOGIN PAGE] Текущий пользователь:', user);
    console.log('[LOGIN PAGE] Состояние location:', location);
    console.log('[LOGIN PAGE] Перенаправление на:', from);

    if (user) {
      console.log('[LOGIN PAGE] Пользователь найден, перенаправление в:', from);
      console.log('[LOGIN PAGE] Данные пользователя:', {
        id: user.id,
        username: user.username,
        email: user.email,
        is_staff: user.is_staff
      });

      // Добавляем небольшую задержку для уверенности, что состояние обновилось
      const redirectTimer = setTimeout(() => {
        navigate(from, { replace: true });
      }, 100);

      return () => clearTimeout(redirectTimer);
    }
  }, [user, navigate, from, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('[LOGIN PAGE] Начало входа', { username });

    try {
      const success = await login(username, password);
      console.log('[LOGIN PAGE] Результат входа:', success);

      if (success) {
        console.log('[LOGIN PAGE] Вход успешен, должен произойти редирект через useEffect');
        // Не вызываем navigate здесь, это сделает useEffect
        // navigate(from, { replace: true });
      } else {
        setError('Неверное имя пользователя или пароль');
        console.log('[LOGIN PAGE] Вход не удался');
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
      console.error('[LOGIN PAGE] Ошибка при входе:', err);
    } finally {
      setLoading(false);
    }
  };

  // Если пользователь уже авторизован, показываем сообщение о перенаправлении
  if (user) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Перенаправление...
          </Typography>
          <Paper elevation={3} sx={{ p: 4, mt: 3, width: '100%', textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body1">
              Вы уже авторизованы. Перенаправляем на дашборд...
            </Typography>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <CssBaseline />
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Вход в админ-панель
          </Typography>

          <Paper elevation={3} sx={{ p: 4, mt: 3, width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Имя пользователя"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Пароль"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Войти'}
              </Button>

              <Grid container>
                <Grid item xs>
                  <Link href="#" variant="body2">
                    Забыли пароль?
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Используйте данные суперпользователя Django
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Команда для создания: python manage.py createsuperuser
            </Typography>
          </Box>
        </Box>
      </Container>
    </>
  );
};

export default Login;