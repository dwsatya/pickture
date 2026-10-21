'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { loginAction } from '@/actions/admin-auth';
import Image from 'next/image';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Harap isi email dan kata sandi.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await loginAction({ email: email.trim(), password });

        if (!result.success) {
          const err = result.error || 'Gagal masuk. Periksa kembali kredensial Anda.';
          setErrorMessage(err);
          toast.error(err);
          return;
        }

        toast.success('Login berhasil! Mengalihkan ke dashboard...');
        router.push('/admin');
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Terjadi kendala jaringan.';
        setErrorMessage(msg);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="w-full max-w-[420px] mx-auto animate-in fade-in zoom-in-95 duration-300">
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <Image
          src="/picture.png"
          alt="Pickture by Nayaka"
          width={996}
          height={376}
          priority
          className="h-12 sm:h-14 w-auto object-contain mb-3 drop-shadow-xs"
        />
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Login Admin
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Masuk untuk mengelola sesi pilih foto
        </p>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-xl shadow-stone-200/50">
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200/80 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <span className="font-semibold shrink-0">Peringatan:</span>
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold text-stone-700 block">
              Email Admin
            </Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                required
                className="pl-10 h-11 rounded-xl bg-stone-50/70 border-stone-200 hover:border-stone-300 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold text-stone-700 block">
              Kata Sandi
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                required
                className="pl-10 pr-10 h-11 rounded-xl bg-stone-50/70 border-stone-200 hover:border-stone-300 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 focus:outline-none transition-colors p-1 rounded-md cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-xl bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-stone-900/10 hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>

          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600/80 shrink-0" />
            <span>Akses dibatasi khusus untuk fotografer (Dewa Satya).</span>
          </div>
        </form>
      </div>
    </div>
  );
}
