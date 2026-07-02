'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAdminState, signInAdmin } from '../../../lib/data-service';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const admin = await getAdminState();
      if (admin.authenticated) {
        window.location.href = '/admin';
      }
    };
    checkAuth();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await signInAdmin(email, password);
    if (success) {
      router.push('/admin');
    } else {
      setStatus('Login failed. Use the correct admin credentials.');
    }
  };

  return (
    <main>
      <nav>
        <strong>Admin access</strong>
        <Link href="/">Back to public page</Link>
      </nav>
      <section className="panel">
        <h1>Admin login</h1>
        <p className="muted">Admin access is restricted. Enter your admin credentials to continue.</p>
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <label>Password</label>
          <input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
          <button type="submit">Sign in</button>
          {status ? <p className="status">{status}</p> : null}
        </form>
      </section>
    </main>
  );
}
