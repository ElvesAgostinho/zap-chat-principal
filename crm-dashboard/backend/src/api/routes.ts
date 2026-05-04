import { Router } from 'express';
import { LeadController } from '../controllers/LeadController';
import { InteractionController } from '../controllers/InteractionController';

const router = Router();

// Leads Routes
router.get('/leads', LeadController.getAll);
router.get('/leads/:id', LeadController.getOne);
router.post('/leads', LeadController.create);
router.patch('/leads/:id', LeadController.update);

// Evolution Webhook
router.post('/webhook/evolution', InteractionController.handleEvolutionWebhook);

export default router;
