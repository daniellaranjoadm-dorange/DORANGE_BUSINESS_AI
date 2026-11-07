import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { OnboardingModal } from "./OnboardingModal";
import { DOrangeBrand } from "../design-system/DOrangeBrand";
import { BUSINESS_SEGMENTS } from "../data/businessSegments";
import {
  ArrowRight,
  CalendarDays,
  Palette,
  PackageCheck,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";
export function LoginView() {
  const { login, setIsOnboardingOpen } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      setError(e.message || "Não foi possível entrar. Confira e-mail e senha.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="min-h-screen bg-[#f6f5f2] grid lg:grid-cols-2 text-[#17191F]">
      <section className="hidden lg:flex flex-col justify-between bg-[#17191F] text-white px-12 xl:px-20 py-12 relative overflow-hidden">
        <div className="absolute -right-40 top-28 w-96 h-96 rounded-full border border-[#C5A46D]/15 pointer-events-none" />
        <div className="absolute -right-24 top-44 w-64 h-64 rounded-full border border-[#C5A46D]/20 pointer-events-none" />
        <DOrangeBrand variant="dark" size="lg" showSubtitle={false} />
        <div className="relative max-w-lg my-12">
          <p className="text-[#C5A46D] text-xs uppercase tracking-[.22em] font-semibold mb-6">
            Gestão com a sua identidade
          </p>
          <h1 className="text-4xl xl:text-5xl font-display font-semibold leading-tight">
            Sua marca em primeiro lugar.
            <br />
            <span className="text-[#C5A46D]">Seu negócio em movimento.</span>
          </h1>
          <p className="text-stone-300 text-base leading-relaxed mt-6">
            Uma rotina mais simples para quem atende, organiza e faz o próprio
            negócio crescer.
          </p>
          <div className="mt-10 space-y-5">
            {[
              [
                Palette,
                "A experiência leva a sua marca",
                "Logo, cores e página de agendamento da sua empresa.",
              ],
              [
                CalendarDays,
                "Do primeiro contato ao próximo horário",
                "Agenda, clientes e comunicação no mesmo lugar.",
              ],
              [
                PackageCheck,
                "Um começo que respeita o seu nicho",
                `Catálogos e insumos sugeridos para ${Object.keys(BUSINESS_SEGMENTS).length} tipos de negócio.`,
              ],
            ].map(([Icon, title, description]: any) => (
              <div key={title} className="flex gap-3">
                <div className="rounded-xl p-2.5 bg-white/5 text-[#C5A46D] h-fit">
                  <Icon size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-sm">{title}</h2>
                  <p className="text-sm text-stone-400 mt-1">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-stone-400">
          D’OR@NGE BUSINESS AI · Tecnologia para negócios de serviços
        </p>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-10">
            <DOrangeBrand size="lg" showSubtitle={false} />
          </div>
          <p className="text-xs tracking-widest uppercase text-stone-500 font-semibold">
            Seu espaço de trabalho
          </p>
          <h2 className="text-3xl font-display font-semibold mt-3">
            Bom ter você de volta.
          </h2>
          <p className="text-sm text-stone-600 mt-3 mb-8">
            Entre para cuidar da agenda, dos clientes e dos próximos passos do
            seu negócio.
          </p>
          {error && (
            <p
              role="alert"
              className="flex gap-2 items-center p-3 mb-5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm"
            >
              <AlertCircle size={18} className="shrink-0" />
              {error}
            </p>
          )}
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="text-sm font-semibold block mb-2"
              >
                E-mail de acesso
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail cadastrado"
                className="w-full p-3.5 rounded-xl border border-stone-300 bg-white outline-none focus:border-stone-900"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="text-sm font-semibold block mb-2"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={visible ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha"
                  className="w-full p-3.5 pr-12 rounded-xl border border-stone-300 bg-white outline-none focus:border-stone-900"
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-2 top-2 p-2 text-stone-500"
                >
                  {visible ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>
            <button
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-[#17191F] hover:bg-stone-800 text-white py-3.5 rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              {busy ? "Entrando…" : "Entrar no meu negócio"}
              <ArrowRight size={17} />
            </button>
          </form>
          <div className="border-t border-stone-200 mt-8 pt-7">
            <p className="text-sm text-stone-600 mb-3">Vai começar agora?</p>
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="w-full bg-white border border-stone-300 hover:border-stone-600 rounded-xl py-3.5 text-sm font-semibold"
            >
              Criar meu espaço com minha marca
            </button>
            <p className="text-xs leading-relaxed text-stone-500 mt-5">
              Use o e-mail da conta cadastrada. Se seu acesso foi recuperado
              nesta máquina, defina sua senha pelo atalho “Ativar meu acesso”.
            </p>
          </div>
        </div>
      </section>
      <OnboardingModal />
    </main>
  );
}
