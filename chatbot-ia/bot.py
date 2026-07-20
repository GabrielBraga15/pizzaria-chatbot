import os
import time
import json
import psycopg2  # <-- Importa o driver do Postgres
from psycopg2.extras import RealDictCursor
from google import genai
from google.genai import types
from google.genai.errors import APIError
from dotenv import load_dotenv

# Carrega as variáveis salvas no arquivo .env para o sistema
load_dotenv()

# Configurações de Modelos
MODELO_PRINCIPAL = os.getenv("MODELO_PRINCIPAL", "gemini-3-flash-preview")
MODELO_FALLBACK = os.getenv("MODELO_FALLBACK", "gemini-2.0-flash")
ARQUIVO_HISTORICO = os.getenv("ARQUIVO_HISTORICO", "historico_conversas.json")

# ID de teste da pizzaria no banco (Simulando o Multi-tenant)
EMPRESA_ID_TESTE = 1

# Inicializa o cliente do Gemini
client = genai.Client()


# --- FUNÇÃO PARA BUSCAR CARDÁPIO DO POSTGRES ---
# Adicione essa linha na função obter_cardapio_do_banco para tratar o Decimal
def obter_cardapio_do_banco(empresa_id):
    """Busca os itens do cardápio diretamente do banco PostgreSQL da empresa especificada."""
    conn = None
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
        )

        cursor = conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT categoria, item_nome, descricao, preco, disponivel 
            FROM cardapios 
            WHERE empresa_id = %s
            ORDER BY categoria, item_nome;
        """
        cursor.execute(query, (empresa_id,))
        itens = cursor.fetchall()

        cursor.close()

        if not itens:
            return "Aviso: O cardápio está vazio no momento."

        # 🔥 PULO DO GATO: Converte todos os campos Decimal para float antes do json.dumps
        for item in itens:
            if "preco" in item and item["preco"] is not None:
                item["preco"] = float(item["preco"])

        # Agora o json.dumps vai rodar liso sem quebrar
        return json.dumps(itens, ensure_ascii=False, indent=2)

    except Exception as e:
        print(f"❌ Erro ao conectar ou buscar do banco de dados: {e}")
        return "Erro temporário ao carregar o cardápio oficial."
    finally:
        if conn:
            conn.close()


# --- FUNÇÃO PARA CONSTRUIR O PROMPT DINAMICAMENTE ---
def gerar_prompt_sistema(empresa_id):
    """Gera o prompt do sistema injetando o cardápio atualizado em tempo real."""
    cardapio_atual = obter_cardapio_do_banco(empresa_id)

    return f"""
Você é o "LG IA", o atendente virtual super simpático e rápido da nossa pizzaria.
Seu objetivo é guiar o cliente no fluxo de forma natural e fechar o pedido em até 3 minutos.

Regras Obrigatórias:
1. Comece saudando e perguntando o nome do cliente.
2. Apresente as opções do cardápio quando solicitado.
3. Se o cliente pedir algo que está com "disponivel": false no cardápio, avise que acabou e sugira outra opção.
4. Entenda variações como "sem cebola", "tira a cebola" e anote nas observações.
5. Pergunte a forma de pagamento e o endereço de entrega.
6. Ao final, confirme o pedido resumindo os itens, preço total, forma de pagamento e endereço de entrega.
7. Seja simpático, rápido e evite respostas longas. Use emojis para tornar a conversa mais leve.

Cardápio oficial atualizado do banco de dados:
{cardapio_atual}
"""


# --- FUNÇÕES DE PERSISTÊNCIA ---
def carregar_historico():
    if os.path.exists(ARQUIVO_HISTORICO):
        try:
            with open(ARQUIVO_HISTORICO, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def salvar_historico(historico):
    with open(ARQUIVO_HISTORICO, "w", encoding="utf-8") as f:
        json.dump(historico, f, ensure_ascii=False, indent=4)


# --- FUNÇÃO RESILIENTE DE ENVIO DE MENSAGEM ---
def enviar_mensagem_com_retry(cliente_id, mensagem_usuario, historico_usuario):
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

    # Buscamos o prompt com o cardápio atual do banco EXATAMENTE antes do envio
    prompt_sistema_atualizado = gerar_prompt_sistema(EMPRESA_ID_TESTE)

    tentativas = 3
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
            return resposta.text

        except APIError as e:
            print(f"⚠️ Erro de API na tentativa {tentativa}: {e.message}")
            if tentativa < tentativas:
                print("Aguardando 2 segundos para tentar novamente...")
                time.sleep(2)
            else:
                return "Poxa, estou com uma instabilidade técnica no momento. Pode repetir o seu pedido, por favor?"
        except Exception as e:
            print(f"⚠️ Erro inesperado: {e}")
            return "Ops, tive um probleminha aqui. Pode enviar a mensagem novamente?"


# --- LOOP PRINCIPAL ---
print(
    "🤖 LG IA Iniciado com Persistência e Integração Postgres! Digite 'sair' para encerrar.\n"
)

CLIENTE_ID = "whatsapp_teste_123"
banco_historico = carregar_historico()

if CLIENTE_ID not in banco_historico:
    banco_historico[CLIENTE_ID] = []

while True:
    mensagem_usuario = input("Você: ")
    if mensagem_usuario.lower() == "sair":
        break

    if not mensagem_usuario.strip():
        continue

    resposta_bot = enviar_mensagem_com_retry(
        CLIENTE_ID, mensagem_usuario, banco_historico[CLIENTE_ID]
    )

    banco_historico[CLIENTE_ID].append({"role": "user", "text": mensagem_usuario})
    banco_historico[CLIENTE_ID].append({"role": "model", "text": resposta_bot})

    salvar_historico(banco_historico)

    print(f"\nBot: {resposta_bot}\n")
