import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  MessageCircle,
  Clock,
  Sparkles,
  Menu as MenuIcon,
  ShoppingBag,
  Zap,
  Check,
  Bot,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
            <Bot className="h-5 w-5 text-brand-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">LG IA</span>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <a href="#funcionalidades" className="text-sm text-muted-foreground hover:text-foreground">Funcionalidades</a>
          <a href="#como-funciona" className="text-sm text-muted-foreground hover:text-foreground">Como funciona</a>
          <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground">Preços</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/login">Entrar</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90">
            <Link to="/cadastro">Contratar agora</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs text-muted-foreground backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            IA humanizada — pronta em minutos
          </div>
          <h1 className="text-balance text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
            Um atendente de IA no{" "}
            <span className="text-gradient-brand">WhatsApp</span> do seu negócio, 24h por dia
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            LG IA atende seus clientes, envia o cardápio e registra pedidos automaticamente —
            sem perder venda, sem cliente esperando.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90">
              <Link to="/cadastro">Assinar por R$ 200/mês</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#como-funciona">Ver como funciona</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Cancele quando quiser · Ativação após confirmação do pagamento
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <ChatMockup />
        </div>
      </div>
    </section>
  );
}

function ChatMockup() {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/80 p-0 shadow-card backdrop-blur">
      <div className="flex items-center gap-3 border-b border-border/60 bg-secondary/40 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-brand">
          <Bot className="h-4 w-4 text-brand-foreground" />
        </div>
        <div>
          <div className="text-sm font-medium">LG IA · Sua Pizzaria</div>
          <div className="text-xs text-muted-foreground">online agora</div>
        </div>
      </div>
      <div className="space-y-3 p-5">
        <Bubble side="left">Oi! Sou a atendente virtual da Pizzaria do Zé 🍕 Quer ver o cardápio ou fazer um pedido?</Bubble>
        <Bubble side="right">Queria uma pizza grande de calabresa</Bubble>
        <Bubble side="left">Perfeito! Pizza grande de calabresa sai por R$ 59,90. Vai querer borda recheada? Temos catupiry e cheddar 😋</Bubble>
        <Bubble side="right">Cheddar 👌</Bubble>
        <Bubble side="left">Anotado! Entrega ou retirada? Já te passo o Pix pra confirmar.</Bubble>
      </div>
    </Card>
  );
}

function Bubble({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  const isLeft = side === "left";
  return (
    <div className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isLeft
            ? "rounded-tl-sm bg-secondary text-secondary-foreground"
            : "rounded-tr-sm bg-gradient-brand text-brand-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

const features = [
  { icon: Clock, title: "Atendimento 24 horas", desc: "Nunca mais perca cliente por demora. A IA responde na hora, todo dia, o dia todo." },
  { icon: Sparkles, title: "IA humanizada", desc: "Conversa natural, tom da sua marca. O cliente sente que está falando com uma pessoa." },
  { icon: MenuIcon, title: "Cardápio automático", desc: "Envia o cardápio do seu negócio na hora certa, com preços e fotos." },
  { icon: ShoppingBag, title: "Pedidos pelo WhatsApp", desc: "Recebe pedidos direto no chat e organiza tudo pra você preparar." },
  { icon: MessageCircle, title: "Integração com seu cardápio", desc: "Conectamos ao cardápio do seu negócio — atualizações refletem no bot." },
  { icon: Zap, title: "Ativação rápida", desc: "Você preenche os dados, paga e libera o acesso em minutos." },
];

function Features() {
  return (
    <section id="funcionalidades" className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight">Tudo que a LG IA faz pelo seu negócio</h2>
          <p className="mt-4 text-muted-foreground">
            Um atendente incansável, treinado pra vender e cuidar dos seus clientes.
          </p>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="border-border/60 bg-card/60 p-6 transition hover:border-primary/40">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
                <f.icon className="h-5 w-5 text-brand-foreground" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  { n: "01", t: "Faça seu cadastro", d: "Preencha email, senha, seu telefone, o WhatsApp comercial que vai receber o atendimento e o Pix que recebe os pagamentos." },
  { n: "02", t: "Confirme o pagamento", d: "Assinatura mensal de R$ 200. Assim que o pagamento cair, sua conta é liberada automaticamente." },
  { n: "03", t: "Receba acesso por email", d: "Enviamos as instruções de acesso no seu email. É só logar e começar a atender." },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-border/60 bg-secondary/20 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-semibold tracking-tight">Ativa em 3 passos</h2>
          <p className="mt-4 text-muted-foreground">Do cadastro ao primeiro atendimento em minutos.</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <Card key={s.n} className="relative border-border/60 bg-card/60 p-7">
              <div className="text-gradient-brand text-4xl font-bold">{s.n}</div>
              <h3 className="mt-3 text-lg font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const perks = [
  "Atendimento 24 horas com IA humanizada",
  "Cardápio automático integrado",
  "Pedidos direto no WhatsApp",
  "Envio automático do Pix ao cliente",
  "Suporte por email",
  "Cancele quando quiser",
];

function Pricing() {
  return (
    <section id="precos" className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight">Um plano, tudo incluso</h2>
          <p className="mt-4 text-muted-foreground">Sem taxa de setup. Sem surpresa na fatura.</p>
        </div>
        <Card className="mt-12 overflow-hidden border-primary/30 bg-card/80 p-0 shadow-glow">
          <div className="bg-gradient-brand px-8 py-4 text-center text-sm font-medium uppercase tracking-wide text-brand-foreground">
            Plano Mensal LG IA
          </div>
          <div className="p-10">
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl text-muted-foreground">R$</span>
                <span className="text-6xl font-bold tracking-tight">200</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">Cobrança mensal recorrente</p>
            </div>
            <ul className="mx-auto mt-8 max-w-sm space-y-3">
              {perks.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm">
                  <Check className="mt-0.5 h-5 w-5 flex-none text-primary" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-10 w-full bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90">
              <Link to="/cadastro">Contratar agora</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

const faqs = [
  { q: "Como funciona o pagamento?", a: "O pagamento é mensal recorrente de R$ 200. Assim que confirmado, você recebe o acesso por email." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim. Não tem fidelidade — cancele quando quiser direto no seu painel." },
  { q: "Preciso ter um número de WhatsApp separado?", a: "Sim. Recomendamos um WhatsApp dedicado para o atendimento automático da LG IA." },
  { q: "A IA realmente parece humana?", a: "Sim — usamos modelos treinados para conversa natural em português, com o tom da sua marca." },
];

function FAQ() {
  return (
    <section className="border-t border-border/60 bg-secondary/20 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center text-4xl font-semibold tracking-tight">Perguntas frequentes</h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <Card key={f.q} className="border-border/60 bg-card/60 p-6">
              <h3 className="font-semibold">{f.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-brand">
            <Bot className="h-3.5 w-3.5 text-brand-foreground" />
          </div>
          LG IA © {new Date().getFullYear()}
        </div>
        <div className="text-xs text-muted-foreground">Feito com IA para o seu negócio</div>
      </div>
    </footer>
  );
}
