const API_URL = 'http://localhost:3000/api';
// Link da Evolution/n8n fornecido pelo usuário
const EVOLUTION_LINK = 'https://sua-instancia-evolution.com'; 

async function fetchLeads() {
    try {
        const response = await fetch(`${API_URL}/leads`);
        const leads = await response.json();
        renderLeads(leads);
        updateStats(leads);
        checkForNotifications(leads);
    } catch (error) {
        console.error('Erro ao buscar leads:', error);
    }
}

function renderLeads(leads) {
    const tbody = document.getElementById('leads-body');
    if (!leads || leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">Nenhum lead encontrado.</td></tr>';
        return;
    }

    tbody.innerHTML = leads.map(lead => `
        <tr class="${lead.status === 'ready_for_human' ? 'pulse-alert' : ''}">
            <td>
                <div style="font-weight: 600;">${lead.name}</div>
                <div style="font-size: 0.8rem; color: #94a3b8;">${lead.phone}</div>
            </td>
            <td>${lead.company || '-'}</td>
            <td><span class="score-badge">${lead.qualification_score}/100</span></td>
            <td>
                <span class="status-badge" style="background: ${getStatusColor(lead.status)}22; color: ${getStatusColor(lead.status)}; border-color: ${getStatusColor(lead.status)}44;">
                    ${lead.status.replace('_', ' ').toUpperCase()}
                </span>
            </td>
            <td>
                <div style="display: flex; gap: 8px;">
                    <button onclick="viewChat('${lead.id}', '${lead.name}')" class="btn-primary" style="padding: 4px 10px; font-size: 0.8rem; background: #6366f1;">Chat</button>
                    <a href="${EVOLUTION_LINK}?phone=${lead.phone || ''}" target="_blank" class="btn-automation">
                        <span>💬</span> WhatsApp
                    </a>
                </div>
            </td>
        </tr>
    `).join('');
}

function checkForNotifications(leads) {
    const urgent = leads.filter(l => l.status === 'ready_for_human');
    if (urgent.length > 0) {
        // Simples notificação visual no título
        document.title = `(${urgent.length}) CRM - Atenção Humana!`;
    } else {
        document.title = `Autonomous CRM | AI Dashboard`;
    }
}

async function viewChat(leadId, name) {
    // Aqui poderíamos abrir um modal. Por agora, vamos apenas alertar o histórico básico ou redirecionar.
    alert(`Visualizando histórico de: ${name}. (Funcionalidade de chat em tempo real sendo vinculada ao Supabase...)`);
}

function getStatusColor(status) {
    const colors = {
        'new': '#38bdf8',
        'qualifying': '#fbbf24',
        'nurturing': '#818cf8',
        'ready_for_human': '#ef4444', // Vermelho para atenção
        'closed': '#10b981',
        'lost': '#94a3b8'
    };
    return colors[status] || '#94a3b8';
}

function updateStats(leads) {
    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter(l => l.qualification_score > 70).length;

    document.querySelectorAll('.stat-val')[0].innerText = totalLeads;
    document.querySelectorAll('.stat-val')[1].innerText = qualifiedLeads;
}

// Initial load
fetchLeads();

// Refresh every 10 seconds for real-time feel
setInterval(fetchLeads, 10000);
