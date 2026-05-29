# 🚀 Zap Chat CRM - High-End SaaS Platform

O **Zap Chat CRM** é uma plataforma empresarial de gestão de vendas e agendamentos integrada directamente com o WhatsApp. Construído para ser escalável, modular e inteligente.

## 🌟 Funcionalidades Principais

*   **IA de Vendas (RAG)**: Bot inteligente que consulta o catálogo de produtos e responde com precisão técnica.
*   **Gestão de Lojas (Multi-tenant)**: Suporte para múltiplas lojas com isolamento total de dados via RLS.
*   **Agendamento Proactivo**: IA capaz de identificar horários livres e sugerir marcações aos clientes.
*   **Hub de Integrações**: Chaves de API para conectar com n8n, Zapier e outros sistemas.
*   **Painéis Administrativos Premium**: Interface moderna construída com React, TailwindCSS e Framer Motion.

## 📁 Estrutura do Projecto

A organização do código segue os princípios de **Clean Architecture**:

- [`frontend/`](file:///c:/Users/DELL/Desktop/zap%20chat/zap-chat-principal/src): Interface React (UI/UX Premium).
- [`supabase/`](file:///c:/Users/DELL/Desktop/zap%20chat/zap-chat-principal/supabase): Backend (Database, Edge Functions, Auth).
- [`automation/`](file:///c:/Users/DELL/Desktop/zap%20chat/zap-chat-principal/automation): Workflows n8n e scripts de automação.
- [`docs/`](file:///c:/Users/DELL/Desktop/zap%20chat/zap-chat-principal/docs): Documentação detalhada do sistema.

## 📖 Documentação Rápida

- [Fluxo de Trabalho (Workflow)](file:///c:/Users/DELL/Desktop/zap%20chat/zap-chat-principal/docs/workflow.md)
- [Arquitetura do Sistema](file:///c:/Users/DELL/Desktop/zap%20chat/zap-chat-principal/docs/architecture.md)
- [Template de Automação (n8n)](file:///c:/Users/DELL/Desktop/zap%20chat/zap-chat-principal/automation/workflows/core_crm_flow.json)

## 🛠️ Tecnologias Utilizadas

*   **Frontend**: React, TypeScript, Vite, TailwindCSS, Lucide.
*   **Backend**: Supabase (PostgreSQL, Edge Functions, Auth, RLS).
*   **Inteligência Artificial**: OpenAI GPT-4o-mini, Embeddings v3.
*   **Automação**: n8n (opcional).

---
*Senior Software Architect - Development Agent*
