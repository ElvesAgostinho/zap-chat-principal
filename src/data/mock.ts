export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA' }).format(value);
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  entregue: 'Entregue',
};

export const statusColors: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-700',
  pago: 'bg-blue-50 text-blue-700',
  entregue: 'bg-primary/10 text-primary',
};

export const deliveryStatusLabels: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  enviado: 'Enviado',
  entregue: 'Entregue',
};

export const paymentStatusLabels: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
};
