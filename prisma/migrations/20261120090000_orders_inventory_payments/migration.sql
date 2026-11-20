-- restaurants.image_url was added to schema.prisma earlier without a migration.
-- IF NOT EXISTS keeps this safe on databases that already got it via `db push`.
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "image_url" VARCHAR(250);

-- CreateEnum
CREATE TYPE "inventory_category_enum" AS ENUM ('meat', 'seafood', 'vegetables', 'dry_goods', 'sauces', 'dairy', 'beverages', 'other');

-- CreateEnum
CREATE TYPE "purchase_order_status_enum" AS ENUM ('ordered', 'partially_received', 'received', 'cancelled');

-- AlterTable inventory_items
ALTER TABLE "inventory_items"
  ADD COLUMN "par_level" DECIMAL(10,3) NOT NULL DEFAULT 0,
  ADD COLUMN "unit_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "category" "inventory_category_enum" NOT NULL DEFAULT 'other',
  ADD COLUMN "default_supplier" VARCHAR(150);

-- AlterTable inventory_transactions
ALTER TABLE "inventory_transactions"
  ADD COLUMN "unit_cost" DECIMAL(10,2),
  ADD COLUMN "purchase_order_item_id" UUID;

-- AlterTable orders
ALTER TABLE "orders"
  ADD COLUMN "table_id" UUID,
  ADD COLUMN "tip" DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "preparing_at" TIMESTAMPTZ(6),
  ADD COLUMN "served_at" TIMESTAMPTZ(6),
  ADD COLUMN "cancelled_at" TIMESTAMPTZ(6);

-- AlterTable restaurant_reviews
ALTER TABLE "restaurant_reviews"
  ADD COLUMN "food_rating" INTEGER,
  ADD COLUMN "service_rating" INTEGER,
  ADD COLUMN "ambience_rating" INTEGER;

-- CreateTable purchase_orders
CREATE TABLE "purchase_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "supplier_name" VARCHAR(150),
    "status" "purchase_order_status_enum" NOT NULL DEFAULT 'ordered',
    "notes" TEXT,
    "total_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "created_by" UUID,
    "expected_at" TIMESTAMPTZ(6),
    "ordered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable purchase_order_items
CREATE TABLE "purchase_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "purchase_order_id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "quantity_ordered" DECIMAL(10,3) NOT NULL,
    "quantity_received" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "purchase_order_items_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "idx_purchase_orders_branch_status" ON "purchase_orders"("restaurant_id", "status", "created_at" DESC);
CREATE INDEX "idx_purchase_order_items_item" ON "purchase_order_items"("inventory_item_id");
CREATE UNIQUE INDEX "purchase_order_items_purchase_order_id_inventory_item_id_key" ON "purchase_order_items"("purchase_order_id", "inventory_item_id");
CREATE INDEX "idx_inventory_tx_po_item" ON "inventory_transactions"("purchase_order_item_id");
CREATE INDEX "idx_orders_table" ON "orders"("table_id");

-- Foreign keys
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_purchase_order_item_id_fkey" FOREIGN KEY ("purchase_order_item_id") REFERENCES "purchase_order_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- CHECK constraints
ALTER TABLE "inventory_items"
  ADD CONSTRAINT inventory_items_par_level_check CHECK (par_level >= 0),
  ADD CONSTRAINT inventory_items_unit_cost_check CHECK (unit_cost >= 0);

ALTER TABLE "inventory_transactions"
  ADD CONSTRAINT inventory_transactions_unit_cost_check CHECK (unit_cost IS NULL OR unit_cost >= 0);

ALTER TABLE "orders"
  ADD CONSTRAINT orders_tip_check CHECK (tip >= 0),
  ADD CONSTRAINT orders_table_only_dine_in_chk CHECK (order_type = 'dine_in' OR table_id IS NULL);

ALTER TABLE "restaurant_reviews"
  ADD CONSTRAINT restaurant_reviews_food_rating_check CHECK (food_rating IS NULL OR food_rating BETWEEN 1 AND 5),
  ADD CONSTRAINT restaurant_reviews_service_rating_check CHECK (service_rating IS NULL OR service_rating BETWEEN 1 AND 5),
  ADD CONSTRAINT restaurant_reviews_ambience_rating_check CHECK (ambience_rating IS NULL OR ambience_rating BETWEEN 1 AND 5);

ALTER TABLE "purchase_orders"
  ADD CONSTRAINT purchase_orders_total_cost_check CHECK (total_cost >= 0);

ALTER TABLE "purchase_order_items"
  ADD CONSTRAINT purchase_order_items_quantity_ordered_check CHECK (quantity_ordered > 0),
  ADD CONSTRAINT purchase_order_items_quantity_received_check CHECK (quantity_received >= 0),
  ADD CONSTRAINT purchase_order_items_unit_cost_check CHECK (unit_cost >= 0);
