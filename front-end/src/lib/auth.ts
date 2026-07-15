// Auth stub client-side. Substituir por Lovable Cloud (Supabase Auth) quando
// integrarmos o pagamento real — a superfície (signIn/signOut/getSession/etc.)
// já espelha o que a versão final vai usar.

export type SubscriptionStatus = "active" | "canceled";

export interface AccountSession {
  email: string;
  telefone: string;
  telefoneComercial: string;
  pix: string;
  status: SubscriptionStatus;
  createdAt: string;
  nextBillingAt: string;
  canceledAt?: string;
}

const KEY = "lg-ia:session";
const PW_KEY = "lg-ia:pw";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getSession(): AccountSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AccountSession) : null;
  } catch {
    return null;
  }
}

function setSession(s: AccountSession | null) {
  if (!isBrowser()) return;
  if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
  else window.localStorage.removeItem(KEY);
}

function nextMonthISO(from = new Date()) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export function registerAccount(input: {
  email: string;
  senha: string;
  telefone: string;
  telefoneComercial: string;
  pix: string;
}) {
  const session: AccountSession = {
    email: input.email,
    telefone: input.telefone,
    telefoneComercial: input.telefoneComercial,
    pix: input.pix,
    status: "active",
    createdAt: new Date().toISOString(),
    nextBillingAt: nextMonthISO(),
  };
  setSession(session);
  if (isBrowser()) window.localStorage.setItem(PW_KEY, input.senha);
}

export function signIn(email: string, senha: string): boolean {
  const s = getSession();
  const pw = isBrowser() ? window.localStorage.getItem(PW_KEY) : null;
  if (!s || !pw) return false;
  return s.email.toLowerCase() === email.toLowerCase() && pw === senha;
}

export function signOut() {
  // mantém a conta (assinatura), apenas encerra a "sessão de UI"
  if (isBrowser()) window.sessionStorage.removeItem("lg-ia:auth");
}

export function markSignedIn() {
  if (isBrowser()) window.sessionStorage.setItem("lg-ia:auth", "1");
}

export function isSignedIn() {
  if (!isBrowser()) return false;
  return window.sessionStorage.getItem("lg-ia:auth") === "1";
}

export function cancelSubscription() {
  const s = getSession();
  if (!s) return;
  setSession({ ...s, status: "canceled", canceledAt: new Date().toISOString() });
}

export function reactivateSubscription() {
  const s = getSession();
  if (!s) return;
  setSession({
    ...s,
    status: "active",
    canceledAt: undefined,
    nextBillingAt: nextMonthISO(),
  });
}
