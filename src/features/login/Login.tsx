import React from 'react';
import { LoginForm } from './LoginForm';

const LoginPage: React.FC = () => {
  return (
    <section className="login-container">
      <h2>Login Page</h2>
      <LoginForm />
    </section>
  );
};

export default LoginPage;
