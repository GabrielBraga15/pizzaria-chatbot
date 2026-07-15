import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Bot, Check, Lock } from "lucide-react";
import { markSignedIn, registerAccount } from "@/lib/auth";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro — LG IA" },
      { name: "description", content: "Contrate o LG IA e ative o atendimento por IA no seu WhatsApp." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Cadastro,
});

const schema = z.object({
  email: z.string().trim().email("Email inválido").max(255),
  senha: z.string().min(8, "Mínimo de 8 caracteres").max(72),
  telefone: z.string().trim().min(10, "Telefone inválido").max(20),
  telefoneComercial: z.string().trim().min(10, "WhatsApp comercial inválido").max(20),
  pix: z.string().trim().min(4, "Informe sua chave Pix").max(150),
});

type FormData = z.infer<typeof schema>;

const initial: FormData = {
  email: "",
  senha: "",
  telefone: "",
  telefoneComercial: "",
  pix: "",
};

function Cadastro() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormData>(k: K, v: FormData[K]) {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validateStep1() {
    const partial = schema.pick({
      email: true,
      senha: true,
      telefone: true,
      telefoneComercial: true,
      pix: true,
    }).safeParse(data);
    if (!partial.success) {
      const errs: Partial<Record<keyof FormData, string>> = {};
      for (const iss of partial.error.issues) {
        const k = iss.path[0] as keyof FormData;
        errs[k] = iss.message;
      }
      setErrors(errs);
      return false;
    }
    return true;
  }

  async function handlePay() {
    setSubmitting(true);
    // Placeholder de pagamento — integração real (Stripe/Mercado Pago) entra aqui.
    await new Promise((r) => setTimeout(r, 1400));
    registerAccount(data);
    markSignedIn();
    setSubmitting(false);
    toast.success("Pagamento simulado com sucesso!");
    navigate({ to: "/obrigado" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-border/60 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
              <Bot className="h-5 w-5 text-brand-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LG IA</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar ao site
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <Stepper step={step} />

        <Card className="mt-8 border-border/60 bg-card/80 p-8 shadow-card">
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Seus dados de acesso</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Vamos usar esses dados para liberar seu acesso após o pagamento.
              </p>
              <div className="mt-6 grid gap-5">
                <Field label="Email" error={errors.email}>
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="voce@seunegocio.com"
                    autoComplete="email"
                  />
                </Field>
                <Field label="Senha" error={errors.senha} hint="Mínimo de 8 caracteres">
                  <Input
                    type="password"
                    value={data.senha}
                    onChange={(e) => update("senha", e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Seu telefone (contato)" error={errors.telefone}>
                  <Input
                    type="tel"
                    value={data.telefone}
                    onChange={(e) => update("telefone", e.target.value)}
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                  />
                </Field>
                <Field
                  label="WhatsApp comercial (atendimento)"
                  error={errors.telefoneComercial}
                  hint="Número que a IA vai usar para atender seus clientes"
                >
                  <Input
                    type="tel"
                    value={data.telefoneComercial}
                    onChange={(e) => update("telefoneComercial", e.target.value)}
                    placeholder="(11) 3333-4444"
                  />
                </Field>
                <Field
                  label="Chave Pix para receber pagamentos"
                  error={errors.pix}
                  hint="Vamos enviar aos seus clientes junto com o pedido"
                >
                  <Input
                    value={data.pix}
                    onChange={(e) => update("pix", e.target.value)}
                    placeholder="CPF, email, telefone ou chave aleatória"
                  />
                </Field>
              </div>
              <div className="mt-8 flex justify-end">
                <Button
                  size="lg"
                  className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
                  onClick={() => {
                    if (validateStep1()) setStep(2);
                  }}
                >
                  Continuar <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Confirme seus dados</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Revise antes de seguir para o pagamento.
              </p>
              <dl className="mt-6 divide-y divide-border/60 rounded-lg border border-border/60 bg-secondary/30">
                <Row k="Email" v={data.email} />
                <Row k="Senha" v={"•".repeat(Math.min(data.senha.length, 12))} />
                <Row k="Seu telefone" v={data.telefone} />
                <Row k="WhatsApp comercial" v={data.telefoneComercial} />
                <Row k="Chave Pix" v={data.pix} />
              </dl>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
                <Button
                  size="lg"
                  className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
                  onClick={() => setStep(3)}
                >
                  Ir para pagamento <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Pagamento</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Assinatura mensal do LG IA.
              </p>

              <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-hero p-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Plano Mensal LG IA</span>
                  <span className="text-3xl font-bold">
                    R$ 200<span className="text-base font-normal text-muted-foreground">/mês</span>
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Atendimento 24h com IA humanizada</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cardápio automático + pedidos no WhatsApp</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Cancele quando quiser</li>
                </ul>
              </div>

              <div className="mt-6 rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Lock className="h-4 w-4" /> Checkout seguro
                </div>
                <p className="mt-1">
                  A integração de pagamento real (Stripe / Mercado Pago) será conectada aqui.
                  Ao confirmar, vamos simular a compra e liberar seu acesso por email.
                </p>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)} disabled={submitting}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
                <Button
                  size="lg"
                  disabled={submitting}
                  onClick={handlePay}
                  className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
                >
                  {submitting ? "Processando..." : "Pagar R$ 200 e ativar"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: "Dados" },
    { n: 2, label: "Revisão" },
    { n: 3, label: "Pagamento" },
  ];
  return (
    <div className="flex items-center justify-center gap-2">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <div key={it.n} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                done
                  ? "bg-primary text-primary-foreground"
                  : active
                    ? "bg-gradient-brand text-brand-foreground shadow-glow"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {done ? <Check className="h-4 w-4" /> : it.n}
            </div>
            <span className={`text-sm ${active ? "text-foreground" : "text-muted-foreground"}`}>
              {it.label}
            </span>
            {i < items.length - 1 && <div className="mx-2 h-px w-10 bg-border" />}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <dt className="text-sm text-muted-foreground">{k}</dt>
      <dd className="text-sm font-medium">{v}</dd>
    </div>
  );
}
