def obter_cardapio():
    return {
        "pizzas": [
            {"id": 1, "nome": "Calabresa", "preco": 42.90, "disponivel": True},
            {"id": 2, "nome": "Margherita", "preco": 45.00, "disponivel": True},
            {
                "id": 3,
                "nome": "Frango com Catupiry",
                "preco": 49.90,
                "disponivel": False,
            },  # Estoque zerado!
        ],
        "bebidas": [
            {"id": 4, "nome": "Coca-Cola 2L", "preco": 11.00, "disponivel": True},
            {"id": 5, "nome": "Suco de Laranja", "preco": 8.50, "disponivel": True},
        ],
    }
