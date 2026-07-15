import os
import time
import json
from google import genai
from google.genai import types
from google.genai.errors import APIError
from cardapio import obter_cardapio
from dotenv import load_dotenv  # <-- Importa o carregador

# Carrega as variáveis salvas no arquivo .env para o sistema
load_dotenv()

# Configurações vindas do arquivo .env (com fallbacks caso o .env suma)
MODELO_PRINCIPAL = os.getenv("MODELO_PRINCIPAL", "gemini-3-flash-preview")
MODELO_FALLBACK = os.getenv("MODELO_FALLBACK", "gemini-2.5-flash")
ARQUIVO_HISTORICO = os.getenv("ARQUIVO_HISTORICO", "historico_conversas.json")

# Inicializa o cliente do Gemini
# (O genai.Client() já lê a variável GEMINI_API_KEY automaticamente do sistema)
client = genai.Client()
cardapio_atual = obter_cardapio()

PROMPT_SISTEMA = f"""
Você é o "PizzaBot", o atendente virtual super simpático e rápido da nossa pizzaria.
Seu objetivo é guiar o cliente no fluxo de forma natural e fechar o pedido em até 3 minutos.

Regras Obrigatórias:
1. Comece saudando e perguntando o nome do cliente.
2. Apresente as opções do cardápio quando solicitado.
3. Se o cliente pedir algo que está com "disponivel": False no cardápio, avise que acabou e sugira outra opção.
4. Entenda variações como "sem cebola", "tira a cebola" e anote nas observações.
5. Pergunte a forma de pagamento e o endereço de entrega.
6. Ao final, confirme o pedido resumindo os itens, preço total, forma de pagamento e endereço de entrega.
7. Seja simpático, rápido e evite respostas longas. Use emojis para tornar a conversa mais leve.
8. 
Cardápio oficial:
{cardapio_atual}
"""


# --- FUNÇÕES DE PERSISTÊNCIA ---
def carregar_historico():
    """Carrega o histórico do arquivo JSON se ele existir."""
    if os.path.exists(ARQUIVO_HISTORICO):
        try:
            with open(ARQUIVO_HISTORICO, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}


def salvar_historico(historico):
    """Salva o histórico atualizado no arquivo JSON."""
    with open(ARQUIVO_HISTORICO, "w", encoding="utf-8") as f:
        json.dump(historico, f, ensure_ascii=False, indent=4)


# --- FUNÇÃO RESILIENTE DE ENVIO DE MENSAGEM ---
def enviar_mensagem_com_retry(cliente_id, mensagem_usuario, historico_usuario):
    """Tenta enviar a mensagem 3 vezes no modelo principal, se falhar, usa o fallback."""

    # Prepara o conteúdo incluindo o histórico salvo para manter o contexto
    conteudo_chat = []
    for msg in historico_usuario:
        conteudo_chat.append(
            types.Content(
                role=msg["role"], parts=[types.Part.from_text(text=msg["text"])]
            )
        )

    # Adiciona a nova mensagem do usuário
    conteudo_chat.append(
        types.Content(role="user", parts=[types.Part.from_text(text=mensagem_usuario)])
    )

    tentativas = 3
    for tentativa in range(1, tentativas + 1):
        # Define qual modelo usar baseado na tentativa
        modelo_atual = MODELO_PRINCIPAL if tentativa < 3 else MODELO_FALLBACK

        try:
            #          print(
            #               f"DEBUG: Tentando enviar mensagem usando o modelo: {modelo_atual} (Tentativa {tentativa}/3)..."
            #            )

            config = types.GenerateContentConfig(
                system_instruction=PROMPT_SISTEMA, temperature=0.7
            )

            # Se for o modelo de preview, desativamos o thinking budget para ser rápido
            if "preview" in modelo_atual:
                config.thinking_config = types.ThinkingConfig(thinking_budget=0)

            resposta = client.models.generate_content(
                model=modelo_atual, contents=conteudo_chat, config=config
            )

            # Retorna o texto da resposta se der certo
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
    "🤖 PizzaBot Iniciado com Persistência e Fallback! Digite 'sair' para encerrar.\n"
)

# Para este exemplo de terminal, vamos usar um ID fixo de usuário (como se fosse o número do WhatsApp)
CLIENTE_ID = "whatsapp_teste_123"
banco_historico = carregar_historico()

# Se o usuário não existe no arquivo, inicia a lista dele vazia
if CLIENTE_ID not in banco_historico:
    banco_historico[CLIENTE_ID] = []

while True:
    mensagem_usuario = input("Você: ")
    if mensagem_usuario.lower() == "sair":
        break

    if not mensagem_usuario.strip():
        continue

    # 1. Envia a mensagem controlando os erros de infraestrutura
    resposta_bot = enviar_mensagem_com_retry(
        CLIENTE_ID, mensagem_usuario, banco_historico[CLIENTE_ID]
    )

    # 2. Atualiza o nosso histórico local na memória
    banco_historico[CLIENTE_ID].append({"role": "user", "text": mensagem_usuario})
    banco_historico[CLIENTE_ID].append({"role": "model", "text": resposta_bot})

    # 3. Grava as alterações direto no arquivo JSON (persistência física)
    salvar_historico(banco_historico)

    print(f"\nBot: {resposta_bot}\n")
