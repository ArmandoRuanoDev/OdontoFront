export interface Plan {
  id_tipo_suscripcion: number;
  nombre: string;
  descripcion: string;
  duracion_dias: number | null;
  precio: number;
  moneda: string;
  max_pacientes: number | null;
  max_citas_mes: number | null;
  max_recetas_mes: number | null;
  requiere_metodo_pago: boolean;
  es_prueba: boolean;
  stripe_price_id: string | null;
  activo: boolean;
}