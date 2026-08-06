🍕 Pizzaria LG IA — Documentação do Sistema
Este repositório contém a infraestrutura e configurações necessárias para rodar o ecossistema do LG IA (Bot de Atendimento Inteligente via WhatsApp com Gemini, FastAPI, Evolution API, TanStack Start e PostgreSQL).

⚙️ Variáveis de Ambiente (.env)
Crie os arquivos .env nos seus respectivos diretórios baseando-se nos modelos abaixo.

🤖 1. Backend AI (chatbot-ia/.env)
Snippet de código
# Google Gemini Config
GEMINI_API_KEY=sua_gemini_api_key_aqui
MODELO_PRINCIPAL=gemini-3-flash-preview
MODELO_FALLBACK=gemini-2.0-flash
ARQUIVO_HISTORICO=historico_conversas.json

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5499
DB_NAME=evolution
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

DATABASE_URL=postgresql://postgres:sua_senha_aqui@localhost:5499/evolution

# Evolution API (Comunicação interna do Docker)
EVOLUTION_API_URL="http://evolution_api:8081"
EVOLUTION_API_KEY="sua_evolution_api_key_aqui"
Nota: Como o container do bot roda dentro da rede Docker, a EVOLUTION_API_URL aponta para o nome do serviço http://evolution_api:8081.

💻 2. Front-End (front-end/.env)
Snippet de código
# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5499
DB_NAME=evolution
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

DATABASE_URL=postgresql://postgres:sua_senha_aqui@localhost:5499/evolution

# Evolution API (Acesso local via máquina host)
EVOLUTION_API_URL="http://localhost:8081"
EVOLUTION_API_KEY="sua_evolution_api_key_aqui"
Nota: Como o server do Front-End roda diretamente no sistema operacional hospedeiro, a EVOLUTION_API_URL aponta para http://localhost:8081.

🗄️ Esquema do Banco de Dados (PostgreSQL)
Execute o DDL abaixo no seu gerenciador de banco de dados (evolution) para estruturar as tabelas necessárias para o ecossistema:

SQL
-- 1. TABELA DE EMPRESAS (Compatível com Front-end e Bot)
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255),
    nome_empresa VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    pix VARCHAR(255),
    telefone VARCHAR(50),
    telefone_comercial VARCHAR(50),
    cnpj_cpf VARCHAR(20),
    whatsapp_num VARCHAR(50),
    bot_status VARCHAR(50) DEFAULT 'OFFLINE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE CARDÁPIO (No singular 'cardapio')
CREATE TABLE cardapio (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    item_nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    disponivel BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_empresa_cardapio 
        FOREIGN KEY (empresa_id) 
        REFERENCES empresas(id) 
        ON DELETE CASCADE
);

-- 3. TABELA DE HISTÓRICO DE CONVERSAS (Memória do Gemini)
CREATE TABLE historico_conversas (
    id SERIAL PRIMARY KEY,
    empresa_id INT NOT NULL,
    cliente_whatsapp VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'user' ou 'model'
    texto TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_empresa_historico 
        FOREIGN KEY (empresa_id) 
        REFERENCES empresas(id) 
        ON DELETE CASCADE
);

-- 4. ÍNDICES DE PERFORMANCE
CREATE INDEX idx_historico_busca 
ON historico_conversas(empresa_id, cliente_whatsapp, id DESC);

CREATE INDEX idx_cardapio_empresa 
ON cardapio(empresa_id);

🚀 Como Inicializar
Suba os containers do PostgreSQL e Evolution API via Docker.

Crie e popule as tabelas no banco de dados com o DDL fornecido acima.

Configure os arquivos .env no chatbot-ia e front-end.

Inicie a API do bot Python (uvicorn main:app --reload ou via Docker).

Inicie o servidor do Front-End (npm run dev).

Conecte o WhatsApp escaneando o QR Code na interface web.