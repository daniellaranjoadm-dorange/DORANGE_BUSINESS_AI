import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OnboardingModal } from './OnboardingModal';
import { Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export function LoginView() {
  const { login, setIsOnboardingOpen } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err.message || 'Falha no login. Verifique suas credenciais.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-stone-100/70 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-stone-200 shadow-xl rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-white font-display font-black text-xl mb-1 shadow-sm">
            D'
          </div>
          <h1 className="text-xl font-display font-bold text-stone-900 tracking-tight">
            D'OR@NGE BUSINESS AI
          </h1>
          <p className="text-xs text-stone-600">
            Acesso ao painel administrativo do seu estabelecimento
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              E-mail de Acesso
            </label>
            <div className="relative">
              <input
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-stone-900 transition-all"
                type="email"
                autoComplete="username"
                required
                placeholder="seuemail@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-stone-900 transition-all"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 disabled:opacity-50 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
          >
            {busy ? 'Entrando…' : 'Entrar no Sistema'}
            {!busy && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        {/* Separator */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-stone-200 w-full" />
          <span className="bg-white px-2 text-[10px] uppercase font-bold text-stone-600 tracking-wider">
            Novo por aqui?
          </span>
        </div>

        {/* Action: Open Onboarding */}
        <button
          type="button"
          onClick={() => setIsOnboardingOpen(true)}
          className="w-full py-2.5 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Cadastrar Meu Estabelecimento (Grátis)
        </button>

        <p className="text-[11px] text-center text-stone-600 leading-relaxed">
          Contas anteriores ativam a senha via linha de comando protegida por scrypt.
        </p>
      </div>

      <OnboardingModal />
    </main>
  );
}
