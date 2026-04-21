-- Primero, asignar un valor por defecto a las filas existentes (datos de prueba)
-- Luego agregar la columna como NOT NULL
ALTER TABLE "orden_compra_detalle" ADD COLUMN "color_nombre" VARCHAR(60) NOT NULL DEFAULT 'Sin color';

-- Quitar el default para que nuevas inserciones requieran el valor obligatoriamente
ALTER TABLE "orden_compra_detalle" ALTER COLUMN "color_nombre" DROP DEFAULT;
