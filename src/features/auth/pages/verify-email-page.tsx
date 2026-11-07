import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { authService } from '@/features/auth/services/auth-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const started = useRef(false);
  const mutation = useMutation({ mutationFn: authService.verifyEmail });

  useEffect(() => {
    if (token && !started.current) {
      started.current = true;
      mutation.mutate({ token });
    }
  }, [mutation, token]);

  const success = mutation.isSuccess;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
      <Card className="w-full max-w-lg border-white/10 bg-slate-900 text-center">
        <CardHeader>
          {success ? <CheckCircle2 className="mx-auto size-12 text-emerald-400" /> : <CircleAlert className="mx-auto size-12 text-orange-400" />}
          <CardTitle>{success ? 'E-mail confirmado' : mutation.isPending ? 'Confirmando e-mail...' : 'Não foi possível confirmar'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-slate-300">
          <p>{success ? mutation.data.message : mutation.isPending ? 'Aguarde alguns segundos.' : token ? 'O link é inválido ou expirou. Solicite um novo link na tela de login.' : 'Token de confirmação ausente.'}</p>
          <Button asChild><Link to="/login">Ir para o login</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
