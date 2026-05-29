# Arquitetura do Projecto Zap Chat CRM

Este projecto segue os princípios de **Clean Architecture** e **Modularização**, conforme as directrizes de um produto SaaS escalável.

## 1. Estrutura de Pastas

*   `frontend/`: Interface construída com React/Vite, utilizando TailwindCSS e Framer Motion para uma experiência premium (High-End).
*   `supabase/`: Toda a lógica de backend, incluindo:
    *   `functions/`: Edge Functions (Deno) para processamento de IA e integrações pesadas.
    *   `migrations/`: Esquema de dados versionado para Supabase.
*   `automation/`: Workflows n8n e scripts de automação.
*   `docs/`: Documentação técnica e de negócio.

## 2. Camadas de Dados (Supabase)

### Multi-tenancy (Loja-id)
Todas as tabelas críticas (`leads`, `agendamentos`, `mensagens`, `produtos`) possuem uma chave estrangeira `loja_id`. Isto permite que múltiplos clientes (lojas) usem a mesma infra-estrutura com isolamento total de dados.

### Inteligência Artificial (RAG)
Usamos **PGVector** no Supabase para busca semântica de produtos.
1.  A mensagem do cliente é convertida em um `embedding`.
2.  A função `match_produtos` encontra os produtos mais relevantes.
3.  O contexto é enviado ao LLM (GPT-4o-mini) para uma resposta precisa.

## 3. Segurança e Integração

*   **API Keys**: Implementadas na tabela `api_keys` para autenticar sistemas externos (n8n, Zapier).
*   **Row Level Security (RLS)**: Política de segurança activa no Supabase que impede que uma loja aceda aos dados de outra.

---
*Senior Software Architect - Antigravity Agent*
