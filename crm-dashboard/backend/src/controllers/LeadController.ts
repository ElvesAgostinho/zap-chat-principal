import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export const LeadController = {
    // List all leads
    async getAll(req: Request, res: Response) {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return res.json(data);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    },

    // Get single lead
    async getOne(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return res.json(data);
        } catch (error: any) {
            return res.status(404).json({ error: 'Lead not found' });
        }
    },

    // Create new lead
    async create(req: Request, res: Response) {
        try {
            const leadData = req.body;
            const { data, error } = await supabase
                .from('leads')
                .insert([leadData])
                .select();

            if (error) throw error;
            return res.status(201).json(data[0]);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    },

    // Update lead status or score (used by n8n or human)
    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const { data, error } = await supabase
                .from('leads')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) throw error;
            return res.json(data[0]);
        } catch (error: any) {
            return res.status(400).json({ error: error.message });
        }
    }
};
