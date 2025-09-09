import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Entrance from './components/Entrance';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import City from './components/City';
import AIDialogue from './components/AIDialogue';
import AudioBook from './components/AudioBook';
import PDFReader from './components/PDFReader';
import Navbar from './components/Navbar';
import './App.css';

// API 配置 - 开发环境使用本地后端，生产环境使用公网地址
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';
axios.defaults.baseURL = isDevelopment ? 'http://localhost:5000' : (isProduction ? 'https://frp-say.com:39668' : '');
axios.defaults.withCredentials = true; // 允许发送cookies

// 响应拦截器 - 处理认证错误
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 只在非认证检查API时处理401错误
    if (error.response?.status === 401 && !error.config.url?.includes('/api/check_auth')) {
      // 认证失败，重定向到登录页
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// TypeScript 接口
interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  // 检查认证状态
  useEffect(() => {
    let isMounted = true;

    const checkAuthStatus = async () => {
      try {
        const response = await axios.get('/api/check_auth');
        if (isMounted) {
          if (response.data.authenticated) {
            setAuthState({
              isAuthenticated: true,
              user: response.data.user,
              loading: false
            });
          } else {
            setAuthState({
              isAuthenticated: false,
              user: null,
              loading: false
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      }
    };

    checkAuthStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = (user: User) => {
    setAuthState({
      isAuthenticated: true,
      user,
      loading: false
    });
  };

  const logout = async () => {
    try {
      await axios.post('/api/logout');
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  if (authState.loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <Router>
      <div className="App">
        {authState.isAuthenticated && <Navbar onLogout={logout} />}
        <Routes>
          <Route
            path="/"
            element={
              authState.isAuthenticated ?
                <Navigate to="/home" replace /> :
                <Entrance />
            }
          />
          <Route
            path="/login"
            element={
              authState.isAuthenticated ?
                <Navigate to="/home" replace /> :
                <Login onLogin={login} />
            }
          />
          <Route
            path="/register"
            element={
              authState.isAuthenticated ?
                <Navigate to="/home" replace /> :
                <Register onLogin={login} />
            }
          />
          <Route
            path="/home"
            element={
              authState.isAuthenticated ?
                <Home user={authState.user} /> :
                <Navigate to="/" replace />
            }
          />
          <Route
            path="/city/:cityName"
            element={
              authState.isAuthenticated ?
                <City /> :
                <Navigate to="/" replace />
            }
          />
          <Route
            path="/ai-dialogue"
            element={
              authState.isAuthenticated ?
                <AIDialogue /> :
                <Navigate to="/" replace />
            }
          />
          <Route
            path="/audio-book"
            element={
              authState.isAuthenticated ?
                <AudioBook /> :
                <Navigate to="/" replace />
            }
          />
          <Route
            path="/pdf-reader/:imageIndex"
            element={
              authState.isAuthenticated ?
                <PDFReader /> :
                <Navigate to="/" replace />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
