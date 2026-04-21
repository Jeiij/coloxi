-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "nombre_completo" VARCHAR(200) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros_sistema" (
    "id" SERIAL NOT NULL,
    "clave" VARCHAR(80) NOT NULL,
    "valor" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "updated_by" UUID,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parametros_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colores" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(60) NOT NULL,
    "codigo_hex" VARCHAR(7),

    CONSTRAINT "colores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "nombre_corto" VARCHAR(120),
    "categoria_id" INTEGER,
    "linea_id" INTEGER,
    "marca_id" INTEGER,
    "presentacion" VARCHAR(50) NOT NULL,
    "capacidad_gal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "equivalencia_kg" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "costo_unitario_sin_iva" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "pvp_colombia" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "factor_venezuela" DECIMAL(10,4) NOT NULL DEFAULT 1.40,
    "stock_actual" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "observaciones" TEXT,
    "created_by" UUID,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_imagenes" (
    "id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "url_imagen" TEXT NOT NULL,
    "es_principal" BOOLEAN NOT NULL DEFAULT false,
    "orden_visual" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_imagenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colores_por_producto" (
    "producto_id" UUID NOT NULL,
    "color_id" INTEGER NOT NULL,

    CONSTRAINT "colores_por_producto_pkey" PRIMARY KEY ("producto_id","color_id")
);

-- CreateTable
CREATE TABLE "ordenes_compra" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_DATE,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
    "mercado" VARCHAR(20) NOT NULL DEFAULT 'COLOMBIA',
    "observaciones" TEXT,
    "iva_porcentaje" DECIMAL(5,2) NOT NULL DEFAULT 19.00,
    "factor_venezuela" DECIMAL(10,4) NOT NULL DEFAULT 1.40,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orden_compra_detalle" (
    "id" UUID NOT NULL,
    "orden_compra_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "producto_codigo" VARCHAR(50) NOT NULL,
    "producto_nombre" VARCHAR(200) NOT NULL,
    "presentacion" VARCHAR(50) NOT NULL,
    "capacidad_gal" DECIMAL(12,2) NOT NULL,
    "equivalencia_kg" DECIMAL(12,2) NOT NULL,
    "cantidad" DECIMAL(14,2) NOT NULL,
    "total_galones" DECIMAL(14,2) NOT NULL,
    "total_kgs" DECIMAL(14,2) NOT NULL,
    "costo_unitario_sin_iva" DECIMAL(14,4) NOT NULL,
    "costo_total_sin_iva" DECIMAL(14,4) NOT NULL,
    "costo_unitario_con_iva" DECIMAL(14,4) NOT NULL,
    "costo_total_con_iva" DECIMAL(14,4) NOT NULL,
    "pvp_colombia_unitario" DECIMAL(14,4) NOT NULL,
    "pvp_colombia_total" DECIMAL(14,4) NOT NULL,
    "ganancia_colombia_unitaria" DECIMAL(14,4) NOT NULL,
    "ganancia_colombia_total" DECIMAL(14,4) NOT NULL,
    "margen_colombia_porcentaje" DECIMAL(8,2),
    "pvp_venezuela_unitario" DECIMAL(14,4) NOT NULL,
    "pvp_venezuela_total" DECIMAL(14,4) NOT NULL,
    "ganancia_venezuela_unitaria" DECIMAL(14,4) NOT NULL,
    "ganancia_venezuela_total" DECIMAL(14,4) NOT NULL,
    "foto_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orden_compra_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" UUID,
    "tabla" VARCHAR(100) NOT NULL,
    "registro_id_uuid" UUID,
    "registro_id_int" INTEGER,
    "accion" VARCHAR(20) NOT NULL,
    "campo" VARCHAR(100),
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT,
    "ip_origen" VARCHAR(50),
    "fecha" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parametros_sistema_clave_key" ON "parametros_sistema"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "lineas_nombre_key" ON "lineas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_key" ON "marcas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "colores_nombre_key" ON "colores"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_key" ON "productos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_compra_codigo_key" ON "ordenes_compra"("codigo");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parametros_sistema" ADD CONSTRAINT "parametros_sistema_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_linea_id_fkey" FOREIGN KEY ("linea_id") REFERENCES "lineas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_marca_id_fkey" FOREIGN KEY ("marca_id") REFERENCES "marcas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_imagenes" ADD CONSTRAINT "producto_imagenes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colores_por_producto" ADD CONSTRAINT "colores_por_producto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colores_por_producto" ADD CONSTRAINT "colores_por_producto_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "colores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes_compra" ADD CONSTRAINT "ordenes_compra_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_compra_detalle" ADD CONSTRAINT "orden_compra_detalle_orden_compra_id_fkey" FOREIGN KEY ("orden_compra_id") REFERENCES "ordenes_compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orden_compra_detalle" ADD CONSTRAINT "orden_compra_detalle_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
