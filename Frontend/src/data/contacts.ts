// Mock de contactos para el flujo de Enviar. Colores tomados de la paleta
// + dos extras suaves para no repetir el cian/lima de la marca.
import { colors } from '@/theme/tokens';

export type Contact = {
  id: string;
  name: string;
  handle: string;
  initials: string;
  color: string;
  // Cuenta destino real del backend (para el envío con doble movimiento).
  // Opcional: los contactos mock no la tienen.
  cuentaDestinoId?: number;
};

export const CONTACTS: Contact[] = [
  { id: 'lr', name: 'Lucía Romero',   handle: '@lucia.r',  initials: 'LR', color: '#E08A55' },
  { id: 'mf', name: 'Mateo Fernández', handle: '@mateo.fdz', initials: 'MF', color: colors.violet },
  { id: 'cr', name: 'Camila Ruiz',     handle: '@cami.ruiz', initials: 'CR', color: colors.cyan },
  { id: 'dl', name: 'Diego López',     handle: '@diegolp',   initials: 'DL', color: colors.green },
  { id: 'vc', name: 'Valeria Castro',  handle: '@valec',     initials: 'VC', color: colors.red },
];

export const findContact = (id: string) => CONTACTS.find(c => c.id === id);
