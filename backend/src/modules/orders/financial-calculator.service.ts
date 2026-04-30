import { Injectable } from '@nestjs/common';

/**
 * Servicio puro de cálculos financieros para órdenes de compra.
 * Centraliza las fórmulas de negocio (IVA, márgenes, ganancias)
 * para mantenerlas testables y desacopladas del servicio de órdenes.
 */

export interface FinancialInput {
  costo_unitario_sin_iva: number;
  pvp_colombia: number;
  pvp_venezuela: number;
  factor_venezuela: number;
  capacidad_gal: number;
  equivalencia_kg: number;
  cantidad: number;
  iva_porcentaje: number;
  pvp_venezuela_manual?: number;
}

export interface FinancialOutput {
  cantidad: number;
  total_galones: number;
  total_kgs: number;
  costo_unitario_sin_iva: number;
  costo_total_sin_iva: number;
  costo_unitario_con_iva: number;
  costo_total_con_iva: number;
  pvp_colombia_unitario: number;
  pvp_colombia_total: number;
  ganancia_colombia_unitaria: number;
  ganancia_colombia_total: number;
  ganancia_colombia_neta_unitaria: number;
  ganancia_colombia_neta_total: number;
  margen_colombia_porcentaje: number;
  costo_ajustado_venezuela: number;
  pvp_venezuela_unitario: number;
  pvp_venezuela_total: number;
  ganancia_venezuela_unitaria: number;
  ganancia_venezuela_total: number;
}

@Injectable()
export class FinancialCalculatorService {
  /**
   * Calcula todos los totales financieros para un ítem de orden de compra.
   * Replica exactamente las fórmulas del Excel de referencia del negocio.
   */
  calculate(input: FinancialInput): FinancialOutput {
    const {
      costo_unitario_sin_iva: G,
      pvp_colombia: L,
      pvp_venezuela,
      factor_venezuela: factorVzla,
      capacidad_gal: capGal,
      equivalencia_kg: eqKg,
      cantidad,
      iva_porcentaje: ivaPct,
      pvp_venezuela_manual,
    } = input;

    // Costos
    const costoTotalSinIva = G * cantidad;
    const costoUnitConIva = G * (1 + ivaPct / 100);
    const costoTotalConIva = costoUnitConIva * cantidad;

    // PVP Colombia
    const pvpColTotal = L * cantidad;

    // Ganancia Bruta Colombia: O = L - G
    const gananciaBrutaUnit = L - G;
    const gananciaBrutaTotal = gananciaBrutaUnit * cantidad;

    // Ganancia Neta Colombia: Q = L - I
    const gananciaNetaUnit = L - costoUnitConIva;
    const gananciaNetaTotal = gananciaNetaUnit * cantidad;

    // Margen: S = O / L * 100
    const margenPct = L > 0 ? (gananciaBrutaUnit / L) * 100 : 0;

    // Venezuela: U = L * Factor
    const costoAjustadoVzla = L * factorVzla;

    // PVP Venezuela (manual > producto > calculado)
    const pvpVzlaBase = pvp_venezuela > 0 ? pvp_venezuela : costoAjustadoVzla;
    const pvpVzlaUnit = pvp_venezuela_manual ?? pvpVzlaBase;
    const pvpVzlaTotal = pvpVzlaUnit * cantidad;

    // Ganancia Venezuela: W = V - U
    const gananciaVzlaUnit = pvpVzlaUnit - costoAjustadoVzla;
    const gananciaVzlaTotal = gananciaVzlaUnit * cantidad;

    // Volúmenes
    const totalGalones = capGal * cantidad;
    const totalKgs = totalGalones * eqKg;

    return {
      cantidad,
      total_galones: totalGalones,
      total_kgs: totalKgs,
      costo_unitario_sin_iva: G,
      costo_total_sin_iva: costoTotalSinIva,
      costo_unitario_con_iva: costoUnitConIva,
      costo_total_con_iva: costoTotalConIva,
      pvp_colombia_unitario: L,
      pvp_colombia_total: pvpColTotal,
      ganancia_colombia_unitaria: gananciaBrutaUnit,
      ganancia_colombia_total: gananciaBrutaTotal,
      ganancia_colombia_neta_unitaria: gananciaNetaUnit,
      ganancia_colombia_neta_total: gananciaNetaTotal,
      margen_colombia_porcentaje: margenPct,
      costo_ajustado_venezuela: costoAjustadoVzla,
      pvp_venezuela_unitario: pvpVzlaUnit,
      pvp_venezuela_total: pvpVzlaTotal,
      ganancia_venezuela_unitaria: gananciaVzlaUnit,
      ganancia_venezuela_total: gananciaVzlaTotal,
    };
  }
}
