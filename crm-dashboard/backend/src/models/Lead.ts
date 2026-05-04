export interface Lead {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    linkedin_url?: string;
    status: 'new' | 'qualifying' | 'nurturing' | 'ready_for_human' | 'closed' | 'lost';
    qualification_score: number;
    bot_active: boolean; // Novo campo de controle
    ai_summary?: string;
    last_interaction_at?: Date;
    created_at?: Date;
    updated_at?: Date;
}
