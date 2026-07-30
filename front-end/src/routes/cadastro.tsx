import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Bot, Check, Lock, Plus, Trash2, Utensils } from "lucide-react";
import { markSignedIn, registerAccount } from "@/lib/auth";
import { cadastrarEmpresaFn } from "@/lib/cadastro";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro — LG IA" },
      {
        name: "description",
        content: "Contrate o LG IA e ative o atendimento por IA no seu WhatsApp.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Cadastro,
});

// Lista Fixa de Categorias
const CATEGORIAS_OPCOES = [
  "Pizzas",
  "Hambúrgueres",
  "Bebidas",
  "Sobremesas",
  "Porções",
  "Outros",
] as const;

// Helper para validar telefone brasileiro (com ou sem máscara)
const phoneRegex = /^(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}|\d{4})[-\s]?\d{4}$/;

// Helper para validar Chave Pix (CPF, CNPJ, Email, TelefoneBR ou Aleatória UUID/EVM)
const pixRegex = /^(?:\d{11}|\d{14}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|\+?55\d{10,11}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;

// Item do Cardápio
const itemCardapioSchema = z.object({
  categoria: z.enum(CATEGORIAS_OPCOES, {
    errorMap: () => ({ message: "Selecione uma categoria válida" }),
  }),
  item_nome: z.string().trim().min(2, "Informe o nome do item"),
  descricao: z.string().trim().optional(),
  preco: z.coerce.number().gt(0, "O preço deve ser maior que 0"),
  disponivel: z.boolean().default(true),
});

export type ItemCardapio = z.infer<typeof itemCardapioSchema>;

const schema = z.object({
  nomeEmpresa: z.string().trim().min(2, "Nome da empresa é obrigatório"),
  email: z.string().trim().email("Informe um e-mail válido").max(255),
  senha: z.string().min(8, "Mínimo de 8 caracteres").max(72),
  telefone: z
    .string()
    .trim()
    .regex(phoneRegex, "Telefone inválido (use DDD + número)"),
  telefoneComercial: z
    .string()
    .trim()
    .regex(phoneRegex, "WhatsApp inválido (use DDD + número)"),
  pix: z
    .string()
    .trim()
    .regex(pixRegex, "Informe uma chave Pix válida (CPF, CNPJ, Email, Tel ou Aleatória)"),
  cardapio: z.array(itemCardapioSchema).min(1, "Adicione pelo menos 1 item ao cardápio"),
});

type FormData = z.infer<typeof schema>;

const initial: FormData = {
  nomeEmpresa: "",
  email: "",
  senha: "",
  telefone: "",
  telefoneComercial: "",
  pix: "",
  cardapio: [
    {
      categoria: "Pizzas",
      item_nome: "Calabresa",
      descricao: "Molho de tomate, muçarela, calabresa fatiada e cebola",
      preco: 45,
      disponivel: true,
    },
  ],
};

function Cadastro() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [data, setData] = useState<FormData>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Estado temporário para novos itens no Step 2
  const [novoItem, setNovoItem] = useState<ItemCardapio>({
    categoria: "Pizzas",
    item_nome: "",
    descricao: "",
    preco: 0,
    disponivel: true,
  });
  const [cardapioError, setCardapioError] = useState<string | null>(null);

  function update<K extends keyof FormData>(k: K, v: FormData[K]) {
    setData((d) => ({ ...d, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  }

  function validateStep1() {
    const partial = schema
      .pick({
        nomeEmpresa: true,
        email: true,
        senha: true,
        telefone: true,
        telefoneComercial: true,
        pix: true,
      })
      .safeParse(data);

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

  function validateStep2() {
    if (data.cardapio.length === 0) {
      setCardapioError("Adicione pelo menos um item ao cardápio para continuar.");
      return false;
    }
    setCardapioError(null);
    return true;
  }

  function adicionarItemCardapio() {
    const parsed = itemCardapioSchema.safeParse(novoItem);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setData((d) => ({ ...d, cardapio: [...d.cardapio, parsed.data] }));
    setNovoItem({
      categoria: novoItem.categoria,
      item_nome: "",
      descricao: "",
      preco: 0,
      disponivel: true,
    });
    setCardapioError(null);
    toast.success("Item adicionado ao cardápio!");
  }

  function removerItemCardapio(index: number) {
    setData((d) => ({
      ...d,
      cardapio: d.cardapio.filter((_, i) => i !== index),
    }));
  }

  async function handlePay() {
    setSubmitting(true);

    try {
      const res = await cadastrarEmpresaFn({ data });

      // Registra a conta no client e salva o ID da empresa recém-criada
      registerAccount({ ...data, id: res.empresaId });
      markSignedIn(res.empresaId);

      setSubmitting(false);
      toast.success("Assinatura realizada e cadastro concluído!");
      navigate({ to: "/obrigado" });
    } catch (e: any) {
      setSubmitting(false);
      console.error("Erro no cliente:", e);

      const msg = e.message?.toLowerCase() || "";
      if (msg.includes("já cadastrado") || msg.includes("duplicate") || msg.includes("unique")) {
        toast.error("Estes dados (e-mail ou telefone) já foram cadastrados por outro cliente.");
      } else {
        toast.error(e.message || "Erro ao finalizar cadastro. Tente novamente.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-transparent shadow-glow">
              <img src="/icon.png" alt="LG IA" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LG IA</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar ao site
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 py-12">
        <Stepper step={step} />

        <Card className="mt-8 border-border/60 bg-card/80 p-8 shadow-card">
          {/* STEP 1: DADOS DE ACESSO E CONTA */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Seus dados de acesso</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Informe o nome da sua empresa e seus dados de login.
              </p>
              <div className="mt-6 grid gap-5">
                <Field label="Nome da Empresa / Pizzaria" error={errors.nomeEmpresa}>
                  <Input
                    type="text"
                    value={data.nomeEmpresa}
                    onChange={(e) => update("nomeEmpresa", e.target.value)}
                    placeholder="Ex: Pizzaria LG IA"
                  />
                </Field>
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
                    maxLength={11}
                    value={data.telefone}
                    onChange={(e) => update("telefone", e.target.value.replace(/\D/g, ""))}
                    placeholder="34999999999"
                    autoComplete="tel"
                  />
                </Field>

                <Field
                  label="WhatsApp comercial (atendimento)"
                  error={errors.telefoneComercial}
                  hint="Número onde o robô de IA irá responder aos seus clientes"
                >
                  <Input
                    type="tel"
                    maxLength={11}
                    value={data.telefoneComercial}
                    onChange={(e) => update("telefoneComercial", e.target.value.replace(/\D/g, ""))}
                    placeholder="34988888888"
                  />
                </Field>
                <Field
                  label="Chave Pix para receber pagamentos"
                  error={errors.pix}
                  hint="Será enviada pela IA ao cliente na confirmação do pedido"
                >
                  <Input
                    value={data.pix}
                    onChange={(e) => update("pix", e.target.value)}
                    placeholder="CPF, CNPJ, Email, Tel ou Chave aleatória"
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
                  Montar Cardápio <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: CARDÁPIO INICIAL */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2">
                <Utensils className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold tracking-tight">
                  Monte seu Cardápio Inicial
                </h1>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre os produtos que o atendente IA deve oferecer aos seus clientes. Você poderá
                alterar tudo no painel depois.
              </p>

              {/* Formulário de Adicionar Item */}
              <div className="mt-6 rounded-xl border border-border/80 bg-secondary/20 p-4 space-y-3">
                <h3 className="text-sm font-semibold">Adicionar novo item</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">Categoria</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={novoItem.categoria}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, categoria: e.target.value as ItemCardapio["categoria"] })
                      }
                    >
                      {CATEGORIAS_OPCOES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Nome do Item</Label>
                    <Input
                      placeholder="Ex: Calabresa Especial"
                      value={novoItem.item_nome}
                      onChange={(e) => setNovoItem({ ...novoItem, item_nome: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Descrição / Ingredientes</Label>
                  <Input
                    placeholder="Ex: Molho de tomate, muçarela, calabresa e cebola"
                    value={novoItem.descricao || ""}
                    onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 items-end">
                  <div>
                    <Label className="text-xs">Preço (R$)</Label>
                    <Input
                      type="number"
                      step="0.50"
                      placeholder="0.00"
                      value={novoItem.preco || ""}
                      onChange={(e) => setNovoItem({ ...novoItem, preco: Number(e.target.value) })}
                    />
                  </div>
                  <Button type="button" onClick={adicionarItemCardapio} className="w-full">
                    <Plus className="mr-1 h-4 w-4" /> Adicionar Item
                  </Button>
                </div>
              </div>

              {cardapioError && (
                <p className="mt-2 text-xs text-destructive font-medium">{cardapioError}</p>
              )}

              {/* Lista de Itens Adicionados */}
              <div className="mt-6 space-y-3">
                <Label className="text-sm font-semibold">
                  Itens no cardápio ({data.cardapio.length})
                </Label>
                {data.cardapio.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                    Nenhum item adicionado ainda.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {data.cardapio.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg border border-border/60 bg-background p-3 text-sm"
                      >
                        <div>
                          <span className="text-xs rounded bg-primary/10 px-2 py-0.5 text-primary font-medium mr-2">
                            {item.categoria}
                          </span>
                          <span className="font-medium text-foreground">{item.item_nome}</span>
                          <p className="text-xs text-muted-foreground">{item.descricao}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">
                            R$ {Number(item.preco).toFixed(2)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removerItemCardapio(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
                <Button
                  size="lg"
                  className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
                  onClick={() => {
                    if (validateStep2()) setStep(3);
                  }}
                >
                  Revisar Cadastro <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: REVISÃO DE DADOS E CARDÁPIO */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Confirme seus dados</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Revise as informações da conta e do cardápio antes do pagamento.
              </p>

              <dl className="mt-6 divide-y divide-border/60 rounded-lg border border-border/60 bg-secondary/30">
                <Row k="Empresa" v={data.nomeEmpresa} />
                <Row k="Email" v={data.email} />
                <Row k="Senha" v={"•".repeat(Math.min(data.senha.length, 12))} />
                <Row k="Seu telefone" v={data.telefone} />
                <Row k="WhatsApp comercial" v={data.telefoneComercial} />
                <Row k="Chave Pix" v={data.pix} />
                <Row k="Itens no Cardápio" v={`${data.cardapio.length} itens cadastrados`} />
              </dl>

              <div className="mt-4 rounded-lg border border-border/60 p-3 bg-background/50">
                <span className="text-xs font-semibold text-muted-foreground">
                  Resumo do Cardápio:
                </span>
                <ul className="mt-1 max-h-32 overflow-y-auto divide-y divide-border/40 text-xs">
                  {data.cardapio.map((item, i) => (
                    <li key={i} className="py-1.5 flex justify-between">
                      <span>
                        {item.item_nome} ({item.categoria})
                      </span>
                      <span className="font-semibold">R$ {Number(item.preco).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar ao Cardápio
                </Button>
                <Button
                  size="lg"
                  className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
                  onClick={() => setStep(4)}
                >
                  Ir para pagamento <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: PAGAMENTO */}
          {step === 4 && (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Pagamento</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Assinatura mensal do sistema LG IA.
              </p>

              <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-hero p-6">
                <div className="flex-col md:flex md:items-baseline md:justify-between">
                  <span className="text-sm text-muted-foreground">Plano Mensal LG IA</span>
                  <br />
                  <span className="text-3xl font-bold">
                    R$ 200<span className="text-base font-normal text-muted-foreground">/mês</span>
                  </span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> Atendimento 24h com IA humanizada
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> Cardápio interativo e pedidos no
                    WhatsApp
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" /> Cancele quando quiser
                  </li>
                </ul>
              </div>

              <div className="mt-6 rounded-lg border border-dashed border-border bg-secondary/20 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Lock className="h-4 w-4" /> Checkout seguro
                </div>
                <p className="mt-1">
                  Ao confirmar, simularemos a contratação do plano e seu cardápio será
                  automaticamente sincronizado no banco de dados.
                </p>
              </div>

              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(3)} disabled={submitting}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Voltar
                </Button>
                <Button
                  size="lg"
                  disabled={submitting}
                  onClick={handlePay}
                  className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
                >
                  {submitting ? "Processando..." : "Pagar R$ 200 e Ativar Bot"}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const items = [
    { n: 1, label: "Conta" },
    { n: 2, label: "Cardápio" },
    { n: 3, label: "Revisão" },
    { n: 4, label: "Pagamento" },
  ];
  return (
    <div className="flex items-center justify-between gap-1 md:justify-center md:gap-2">
      {items.map((it, i) => {
        const active = step === it.n;
        const done = step > it.n;
        return (
          <div key={it.n} className="flex items-center gap-1.5 md:gap-2">
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
            <span
              className={`text-xs md:text-sm ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {it.label}
            </span>
            {i < items.length - 1 && <div className="h-px w-4 bg-border md:w-8" />}
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