import os
import time
import json
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from google import genai
from google.genai import types
from google.genai.errors import APIError
from dotenv import load_dotenv

load_dotenv()

# Configurações do Modelo Gemini
MODELO_PRINCIPAL = os.getenv("MODELO_PRINCIPAL", "gemini-3-flash-preview")
MODELO_FALLBACK = os.getenv("MODELO_FALLBACK", "gemini-2.0-flash")

# Configurações da Evolution API
EVOLUTION_API_URL = os.getenv("EVOLUTION_API_URL")
EVOLUTION_API_KEY = os.getenv("EVOLUTION_API_KEY")

# ID fixo ou vindo do ambiente para a instância do container
EMPRESA_ID = int(os.getenv("EMPRESA_ID", "1"))
INSTANCE_NAME = os.getenv("INSTANCE_NAME", "empresa_1")

client = genai.Client()
app = FastAPI(title="LG IA - Bot Engine")


# --- CONEXÃO COM BANCO DE DADOS ---
def get_db_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
        database=os.getenv("DB_NAME", "lg_ia"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", "postgres"),
    )


# --- BUSCA CARDÁPIO NO POSTGRES ---
def obter_cardapio_do_banco(empresa_id: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        # Alterado de cardapios para cardapio
        query = """
            SELECT categoria, item_nome, descricao, preco, disponivel 
            FROM cardapio 
            WHERE empresa_id = %s
            ORDER BY categoria, item_nome;
        """
        cursor.execute(query, (empresa_id,))
        itens = cursor.fetchall()
        cursor.close()

        if not itens:
            return "Aviso: O cardápio está vazio no momento."

        for item in itens:
            if "preco" in item and item["preco"] is not None:
                item["preco"] = float(item["preco"])

        return json.dumps(itens, ensure_ascii=False, indent=2)

    except Exception as e:
        print(f"Erro ao buscar cardápio: {e}")
        return "Erro temporário ao carregar o cardápio oficial."
    finally:
        if conn:
            conn.close()


# --- GERADOR DE PROMPT SISTEMA ---
def gerar_prompt_sistema(empresa_id: int):
    cardapio_atual = obter_cardapio_do_banco(empresa_id)

    return f"""
Você é o "LG IA", o atendente virtual super simpático e rápido da nossa pizzaria.
Seu objetivo é guiar o cliente no fluxo de forma natural e fechar o pedido em até 3 minutos.

Regras Obrigatórias:
1. Comece saudando e perguntando o nome do cliente se for o primeiro contato.
2. Apresente as opções do cardápio quando solicitado.
3. Se o cliente pedir algo que está com "disponivel": false no cardápio, avise que acabou e sugira outra opção.
4. Entenda variações como "sem cebola", "tira a cebola" e anote nas observações.
5. Pergunte a forma de pagamento e o endereço de entrega.
6. Ao final, confirme o pedido resumindo os itens, preço total, forma de pagamento e endereço de entrega.
7. Seja simpático, rápido e evite respostas longas. Use emojis para tornar a conversa mais leve.

Cardápio oficial atualizado do banco de dados:
{cardapio_atual}
"""


# --- PERSISTÊNCIA DE HISTÓRICO NO POSTGRES ---
def carregar_historico_db(empresa_id: int, cliente_whatsapp: str, limite: int = 15):
    """Busca as últimas 'limite' mensagens do cliente para manter a memória da conversa."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT role, texto 
            FROM (
                SELECT role, texto, created_at 
                FROM historico_conversas 
                WHERE empresa_id = %s AND cliente_whatsapp = %s
                ORDER BY id DESC 
                LIMIT %s
            ) sub
            ORDER BY created_at ASC;
        """
        cursor.execute(query, (empresa_id, cliente_whatsapp, limite))
        mensagens = cursor.fetchall()
        cursor.close()

        return [{"role": m["role"], "text": m["texto"]} for m in mensagens]

    except Exception as e:
        print(f"❌ Erro ao carregar histórico do banco: {e}")
        return []
    finally:
        if conn:
            conn.close()


def salvar_mensagem_db(empresa_id: int, cliente_whatsapp: str, role: str, texto: str):
    """Grava uma nova mensagem (user ou model) na tabela de histórico."""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        query = """
            INSERT INTO historico_conversas (empresa_id, cliente_whatsapp, role, texto)
            VALUES (%s, %s, %s, %s);
        """
        cursor.execute(query, (empresa_id, cliente_whatsapp, role, texto))
        conn.commit()
        cursor.close()
    except Exception as e:
        print(f"❌ Erro ao salvar mensagem no banco: {e}")
    finally:
        if conn:
            conn.close()


# --- COMUNICAÇÃO COM EVOLUTION API ---
def enviar_resposta_whatsapp(cliente_whatsapp: str, texto: str):
    """Envia a mensagem de resposta via Evolution API para o número do cliente."""
    url = f"{EVOLUTION_API_URL}/message/sendText/{INSTANCE_NAME}"
    headers = {"apikey": EVOLUTION_API_KEY, "Content-Type": "application/json"}
    payload = {"number": cliente_whatsapp, "text": texto}

    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code not in (200, 201):
            print(f"⚠️ Erro Evolution API ({res.status_code}): {res.text}")
    except Exception as e:
        print(f"❌ Falha de rede ao chamar Evolution API: {e}")


# --- ENVIO AO GEMINI COM RETRY ---
def enviar_mensagem_com_retry(
    empresa_id: int, cliente_whatsapp: str, mensagem_usuario: str
):
    # 1. Carrega o histórico da conversa do Postgres
    historico_usuario = carregar_historico_db(empresa_id, cliente_whatsapp)

    # 2. Prepara os conteúdos para o SDK do Gemini
    conteudo_chat = []
    for msg in historico_usuario:
        conteudo_chat.append(
            types.Content(
                role=msg["role"], parts=[types.Part.from_text(text=msg["text"])]
            )
        )

    conteudo_chat.append(
        types.Content(role="user", parts=[types.Part.from_text(text=mensagem_usuario)])
    )

    prompt_sistema_atualizado = gerar_prompt_sistema(empresa_id)

    # 3. Executa a chamada com fallback de modelo
    tentativas = 3
    resposta_texto = ""

    for tentativa in range(1, tentativas + 1):
        modelo_atual = MODELO_PRINCIPAL if tentativa < 3 else MODELO_FALLBACK

        try:
            config = types.GenerateContentConfig(
                system_instruction=prompt_sistema_atualizado, temperature=0.7
            )

            if "preview" in modelo_atual:
                config.thinking_config = types.ThinkingConfig(thinking_budget=0)

            resposta = client.models.generate_content(
                model=modelo_atual, contents=conteudo_chat, config=config
            )
            resposta_texto = resposta.text
            break

        except APIError as e:
            print(f"⚠️ Erro de API Gemini na tentativa {tentativa}: {e.message}")
            if tentativa < tentativas:
                time.sleep(2)
            else:
                resposta_texto = "Poxa, estou com uma instabilidade técnica no momento. Pode repetir o seu pedido, por favor?"
        except Exception as e:
            print(f"⚠️ Erro inesperado no Gemini: {e}")
            resposta_texto = (
                "Ops, tive um probleminha técnico aqui. Pode reenviar sua mensagem?"
            )

    # 4. Salva a interação (mensagem do usuário + resposta da IA) no banco
    salvar_mensagem_db(empresa_id, cliente_whatsapp, "user", mensagem_usuario)
    salvar_mensagem_db(empresa_id, cliente_whatsapp, "model", resposta_texto)

    # 5. Envia via WhatsApp de volta
    enviar_resposta_whatsapp(cliente_whatsapp, resposta_texto)


# --- WEBHOOK WEB DA EVOLUTION API ---
@app.post("/webhook")
async def webhook_evolution(request: Request, background_tasks: BackgroundTasks):
    """
    Endpoint que a Evolution API vai chamar a cada mensagem recebida no WhatsApp.
    """
    body = await request.json()

    # Ignora eventos que não sejam novas mensagens
    event = body.get("event")
    if event != "messages.upsert":
        return {"status": "ignored_event"}

    data = body.get("data", {})
    key = data.get("key", {})

    # Se a mensagem foi enviada pelo próprio bot/atendente, ignoramos
    if key.get("fromMe", False):
        return {"status": "from_me_ignored"}

    # Extrai o número do cliente e o texto
    remote_jid = key.get("remoteJid", "")
    cliente_whatsapp = remote_jid.split("@")[0]  # Ex: 5534999999999

    # Ignora mensagens de grupos
    if "@g.us" in remote_jid:
        return {"status": "group_ignored"}

    message_data = data.get("message", {})
    mensagem_usuario = (
        message_data.get("conversation")
        or message_data.get("extendedTextMessage", {}).get("text")
        or ""
    ).strip()

    if not mensagem_usuario:
        return {"status": "empty_message"}

    # Processa o Gemini em segundo plano para não travar a resposta HTTP do webhook
    background_tasks.add_task(
        enviar_mensagem_com_retry, EMPRESA_ID, cliente_whatsapp, mensagem_usuario
    )

    return {"status": "processing"}


@app.get("/health")
def health_check():
    return {"status": "ok", "empresa_id": EMPRESA_ID}
