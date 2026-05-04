import requests
import json
import time

# Configurações do n8n local
# Nota: Use o URL de 'Production' ou 'Test' do seu nó de Webhook no n8n
N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/lead-capture"

def simulate_new_lead():
    lead_data = {
        "name": "Elon Musk",
        "email": "elon@spacex.com",
        "company": "SpaceX",
        "linkedin_url": "https://www.linkedin.com/in/elonmusk",
        "message": "Tenho interesse em automatizar toda a minha frota de vendas usando sua solução de IA. O orçamento não é um problema."
    }

    print(f"🚀 Enviando novo lead para o n8n: {lead_data['name']}...")
    
    try:
        response = requests.post(N8N_WEBHOOK_URL, json=lead_data)
        
        if response.status_code == 200:
            print("✅ Lead enviado com sucesso!")
            print("Response:", response.text)
            print("\nO que deve acontecer agora:")
            print("1. O n8n vai receber este JSON.")
            print("2. O nó Groq/AI vai ler a mensagem e decidir que o score é alto (perto de 100).")
            print("3. O n8n vai inserir/atualizar este lead no seu Supabase.")
            print("4. Seu Dashboard vai mostrar o Elon Musk como um lead 'Ready for Human'!")
        else:
            print(f"❌ Erro ao enviar lead. Status Code: {response.status_code}")
            print("Dica: Verifique se o seu n8n está rodando e se o Webhook está ativo no modo 'Listen for Test Event'.")
            
    except Exception as e:
        print(f"❌ Falha de conexão: {e}")

if __name__ == "__main__":
    simulate_new_lead()
