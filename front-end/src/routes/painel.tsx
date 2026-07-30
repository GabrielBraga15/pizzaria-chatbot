import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getUsuarioLogado } from '@/lib/auth';
import {
  getCardapio,
  criarItemCardapio,
  atualizarItemCardapio,
  atualizarStatusItemCardapio,
  deletarItemCardapio,
} from '@/lib/cardapio';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Bot,
  LogOut,
  MessageCircle,
  Phone,
  KeyRound,
  Calendar,
  Wallet,
  RotateCcw,
  XCircle,
  LifeBuoy,
  Utensils,
  Plus,
  Pencil,
  Trash2,
  Check,
  Building2,
  Loader2,
} from 'lucide-react';

export const Route = createFileRoute('/painel')({
  head: () => ({
    meta: [{ title: 'Painel — LG IA' }, { name: 'robots', content: 'noindex' }],
  }),
  component: Painel,
});

const SUPPORT_WHATSAPP = '5511999999999';
const SUPPORT_EMAIL = 'suporte@lgia.app';

export interface ItemCardapio {
  id: string;
  empresa_id: string;
  categoria: string;
  item_nome: string;
  descricao?: string;
  preco: number;
  disponivel: boolean;
}

export interface EmpresaUsuario {
  id: string;
  nomeEmpresa: string;
  email: string;
  telefone: string;
  telefoneComercial: string;
  pix: string;
  statusAssinatura: 'active' | 'canceled';
  proximaCobranca: string;
  criadoEm: string;
}

// Utilitário para formatação de moeda em BRL
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val);
};

export function Painel() {
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState<EmpresaUsuario | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Estados do Cardápio
  const [cardapio, setCardapio] = useState<ItemCardapio[]>([]);
  const [loadingCardapio, setLoadingCardapio] = useState(true);
  const [savingItem, setSavingItem] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemCardapio | null>(null);

  const [formItem, setFormItem] = useState({
    categoria: '',
    item_nome: '',
    descricao: '',
    preco: '',
    disponivel: true,
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  // 1. Carrega dados da Empresa via Server Function
  const fetchUsuario = async () => {
    try {
      setLoadingUser(true);
      const empresaId = localStorage.getItem('empresa_id') || '1'; 

      const data = await getUsuarioLogado({ data: empresaId });

      if (!data) {
        throw new Error('Empresa não encontrada');
      }

      setUsuario(data as EmpresaUsuario);
    } catch (error) {
      console.error(error);
      toast.error('Sessão expirada ou erro ao carregar dados. Faça login novamente.');
      localStorage.removeItem('auth_token');
      navigate({ to: '/login' });
    } finally {
      setLoadingUser(false);
    }
  };

  // 2. Carrega Cardápio via Server Function
  const fetchCardapio = async () => {
    try {
      setLoadingCardapio(true);
      const data = await getCardapio();
      setCardapio(data as ItemCardapio[]);
    } catch {
      toast.error('Não foi possível carregar o cardápio do banco.');
    } finally {
      setLoadingCardapio(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate({ to: '/login' });
      return;
    }

    fetchUsuario();
    fetchCardapio();
  }, []);

  function handleLogout() {
    localStorage.removeItem('auth_token');
    navigate({ to: '/login' });
  }

  // Operações de Assinatura
  async function handleCancelSubscription() {
    try {
      const res = await fetch('/api/assinatura/cancelar', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success('Assinatura cancelada com sucesso.');
      fetchUsuario();
    } catch {
      toast.error('Erro ao cancelar assinatura no banco.');
    }
  }

  async function handleReactivateSubscription() {
    try {
      const res = await fetch('/api/assinatura/reativar', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error();
      toast.success('Assinatura reativada!');
      fetchUsuario();
    } catch {
      toast.error('Erro ao reativar assinatura.');
    }
  }

  // Operações do Cardápio via Server Functions
  function handleOpenAddModal() {
    setEditingItem(null);
    setFormItem({
      categoria: '',
      item_nome: '',
      descricao: '',
      preco: '',
      disponivel: true,
    });
    setModalOpen(true);
  }

  function handleOpenEditModal(item: ItemCardapio) {
    setEditingItem(item);
    setFormItem({
      categoria: item.categoria,
      item_nome: item.item_nome,
      descricao: item.descricao || '',
      preco: item.preco.toString(),
      disponivel: item.disponivel,
    });
    setModalOpen(true);
  }

  async function handleSaveItem() {
    if (!formItem.categoria.trim() || !formItem.item_nome.trim() || !formItem.preco) {
      toast.error('Preencha categoria, nome e preço!');
      return;
    }

    const priceNum = parseFloat(formItem.preco.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error('Preço inválido.');
      return;
    }

    setSavingItem(true);
    const payload = {
      categoria: formItem.categoria.trim(),
      item_nome: formItem.item_nome.trim(),
      descricao: formItem.descricao.trim(),
      preco: priceNum,
      disponivel: formItem.disponivel,
    };

    try {
      if (editingItem) {
        const updated = await atualizarItemCardapio({
          data: { id: editingItem.id, ...payload },
        });

        setCardapio((prev) =>
          prev.map((it) => (it.id === editingItem.id ? (updated as ItemCardapio) : it)),
        );
        toast.success('Produto atualizado!');
      } else {
        const newItem = await criarItemCardapio({ data: payload });
        setCardapio((prev) => [...prev, newItem as ItemCardapio]);
        toast.success('Produto adicionado!');
      }
      setModalOpen(false);
    } catch {
      toast.error('Erro ao salvar no banco de dados.');
    } finally {
      setSavingItem(false);
    }
  }

  async function handleToggleDisponivel(id: string, currentStatus: boolean) {
    // Optimistic UI update
    setCardapio((prev) =>
      prev.map((it) => (it.id === id ? { ...it, disponivel: !currentStatus } : it)),
    );

    try {
      await atualizarStatusItemCardapio({
        data: { id, disponivel: !currentStatus },
      });
      toast.success('Status atualizado.');
    } catch {
      // Reverte em caso de erro
      setCardapio((prev) =>
        prev.map((it) => (it.id === id ? { ...it, disponivel: currentStatus } : it)),
      );
      toast.error('Falha ao atualizar status.');
    }
  }

  async function handleDeleteItem(id: string) {
    try {
      await deletarItemCardapio({ data: { id } });
      setCardapio((prev) => prev.filter((it) => it.id !== id));
      toast.success('Item removido.');
    } catch {
      toast.error('Não foi possível excluir o item.');
    }
  }

  function openSupport() {
    const msg = encodeURIComponent(
      `Olá! Sou cliente da LG IA (${usuario?.email}) e preciso de ajuda.`,
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`, '_blank', 'noopener');
  }

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-sm font-medium">Autenticando e conectando ao banco...</span>
      </div>
    );
  }

  if (!usuario) return null;

  const isAssinaturaAtiva = usuario.statusAssinatura === 'active';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
              <Bot className="h-5 w-5 text-brand-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LG IA</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Painel — {usuario.nomeEmpresa}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie os itens do seu cardápio integrados à inteligência artificial.
            </p>
          </div>
          <Button
            onClick={openSupport}
            className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
          >
            <LifeBuoy className="mr-2 h-4 w-4" /> Acionar suporte
          </Button>
        </div>

        {/* SECTION: GESTÃO DO CARDÁPIO */}
        <Card className="mt-8 border-border/60 bg-card/70 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Utensils className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Cardápio no Banco de Dados</h2>
                <p className="text-xs text-muted-foreground">
                  Alterações feitas aqui sincronizam imediatamente com o atendimento no WhatsApp.
                </p>
              </div>
            </div>
            <Button
              onClick={handleOpenAddModal}
              size="sm"
              className="bg-primary text-primary-foreground"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Adicionar Produto
            </Button>
          </div>

          <div className="mt-6">
            {loadingCardapio ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
                Carregando registros do banco...
              </div>
            ) : cardapio.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                Nenhum produto cadastrado no banco. Clique em "Adicionar Produto" para criar o
                primeiro.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {cardapio.map((item) => (
                  <div
                    key={item.id}
                    className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                      item.disponivel
                        ? 'border-border/60 bg-background/60'
                        : 'border-border/40 bg-secondary/10 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {item.categoria}
                        </span>
                        <div className="flex items-center gap-2">
                          <Label
                            htmlFor={`switch-${item.id}`}
                            className="text-[11px] text-muted-foreground cursor-pointer"
                          >
                            {item.disponivel ? 'Ativo' : 'Pausado'}
                          </Label>
                          <Switch
                            id={`switch-${item.id}`}
                            checked={item.disponivel}
                            onCheckedChange={() => handleToggleDisponivel(item.id, item.disponivel)}
                          />
                        </div>
                      </div>
                      <h3 className="mt-2 font-semibold text-foreground">{item.item_nome}</h3>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {item.descricao || 'Sem descrição'}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(Number(item.preco))}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEditModal(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* MODAL / DIALOG DE CADASTRO E EDIÇÃO */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-106.25">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </DialogTitle>
              <DialogDescription>
                Informe os dados do produto que será armazenado no container do banco.
              </DialogDescription>
            </DialogHeader>

            <fieldset disabled={savingItem} className="grid gap-4 py-3 border-none">
              <div className="grid gap-1.5">
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  placeholder="Ex: Pizzas, Bebidas, Sobremesas"
                  value={formItem.categoria}
                  onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value })}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="nome">Nome do Produto</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Pizza Calabresa"
                  value={formItem.item_nome}
                  onChange={(e) => setFormItem({ ...formItem, item_nome: e.target.value })}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="descricao">Descrição / Ingredientes</Label>
                <Input
                  id="descricao"
                  placeholder="Ex: Calabresa, cebola e muçarela"
                  value={formItem.descricao}
                  onChange={(e) => setFormItem({ ...formItem, descricao: e.target.value })}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="preco">Preço (R$)</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.50"
                  placeholder="40.00"
                  value={formItem.preco}
                  onChange={(e) => setFormItem({ ...formItem, preco: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <Label htmlFor="disponivel-modal" className="text-sm cursor-pointer">
                  Disponível para venda na IA
                </Label>
                <Switch
                  id="disponivel-modal"
                  checked={formItem.disponivel}
                  onCheckedChange={(val) => setFormItem({ ...formItem, disponivel: val })}
                />
              </div>
            </fieldset>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={savingItem}>
                Cancelar
              </Button>
              <Button
                onClick={handleSaveItem}
                disabled={savingItem}
                className="bg-gradient-brand text-brand-foreground shadow-glow"
              >
                {savingItem ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  <>
                    <Check className="mr-1.5 h-4 w-4" /> Salvar no Banco
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* STATUS DA ASSINATURA */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <Card className="border-border/60 bg-card/70 p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Plano</div>
                <div className="mt-1 text-xl font-semibold">Plano Mensal LG IA</div>
                <div className="mt-1 text-sm text-muted-foreground">R$ 200,00 / mês</div>
              </div>
              {isAssinaturaAtiva ? (
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Ativa
                </Badge>
              ) : (
                <Badge variant="destructive">Cancelada</Badge>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={Calendar}
                label={isAssinaturaAtiva ? 'Próxima cobrança' : 'Status no Banco'}
                value={
                  isAssinaturaAtiva
                    ? new Date(usuario.proximaCobranca).toLocaleDateString('pt-BR')
                    : 'Cancelada'
                }
              />
              <InfoRow
                icon={Wallet}
                label="Cadastrado em"
                value={new Date(usuario.criadoEm).toLocaleDateString('pt-BR')}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-border/60 pt-6">
              {isAssinaturaAtiva ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" /> Cancelar assinatura
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar assinatura no banco?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ao cancelar, o status do seu usuário no container será alterado para
                        desativado ao término da vigência.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Confirmar Cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  onClick={handleReactivateSubscription}
                  className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Reativar no Banco
                </Button>
              )}
              <Button variant="outline" onClick={openSupport}>
                <MessageCircle className="mr-2 h-4 w-4" /> Falar com suporte
              </Button>
            </div>
          </Card>

          {/* Card Suporte */}
          <Card className="border-border/60 bg-card/70 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
              <LifeBuoy className="h-5 w-5 text-brand-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Suporte Técnico</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fale conosco se precisar sincronizar a automação da IA.
            </p>
            <div className="mt-4 grid gap-2">
              <Button
                onClick={openSupport}
                className="w-full bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href={`mailto:${SUPPORT_EMAIL}`}>Enviar e-mail</a>
              </Button>
            </div>
          </Card>
        </div>

        {/* Dados Cadastrados no Banco */}
        <Card className="mt-6 border-border/60 bg-card/70 p-6">
          <h2 className="text-lg font-semibold">Dados da conta (do Banco)</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoRow icon={Building2} label="Empresa" value={usuario.nomeEmpresa} />
            <InfoRow icon={KeyRound} label="Email de Login" value={usuario.email} />
            <InfoRow icon={Phone} label="Telefone" value={usuario.telefone} />
            <InfoRow
              icon={MessageCircle}
              label="WhatsApp do Bot"
              value={usuario.telefoneComercial}
            />
            <InfoRow icon={Wallet} label="Chave Pix Cadastrada" value={usuario.pix} />
          </dl>
        </Card>
      </main>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
      <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-secondary">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}