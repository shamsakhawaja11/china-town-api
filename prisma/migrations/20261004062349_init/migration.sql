-- CreateEnum
CREATE TYPE "assignment_status_enum" AS ENUM ('assigned', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "ingredient_component_enum" AS ENUM ('main', 'filling', 'coating', 'seasoning', 'sauce', 'garnish');

-- CreateEnum
CREATE TYPE "inventory_txn_type_enum" AS ENUM ('purchase', 'usage', 'adjustment', 'waste');

-- CreateEnum
CREATE TYPE "order_status_enum" AS ENUM ('draft', 'pending', 'accepted', 'rejected', 'preparing', 'ready', 'served', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "order_type_enum" AS ENUM ('dine_in', 'takeaway');

-- CreateEnum
CREATE TYPE "payment_method_enum" AS ENUM ('cash', 'card', 'wallet');

-- CreateEnum
CREATE TYPE "payment_status_enum" AS ENUM ('unpaid', 'paid', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "payment_txn_status_enum" AS ENUM ('initiated', 'succeeded', 'failed');

-- CreateEnum
CREATE TYPE "refund_status_enum" AS ENUM ('pending', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "reservation_status_enum" AS ENUM ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show');

-- CreateEnum
CREATE TYPE "review_analysis_status_enum" AS ENUM ('pending', 'genuine', 'suspicious', 'confirmed_fake');

-- CreateEnum
CREATE TYPE "spice_level_enum" AS ENUM ('none', 'mild', 'medium', 'hot', 'extra_hot');

-- CreateEnum
CREATE TYPE "staff_type_enum" AS ENUM ('chef', 'waiter', 'manager');

-- CreateEnum
CREATE TYPE "table_assignment_status_enum" AS ENUM ('assigned', 'released');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('customer', 'staff', 'admin');

-- CreateEnum
CREATE TYPE "wallet_transaction_type_enum" AS ENUM ('credit', 'debit', 'refund');

-- CreateTable
CREATE TABLE "allergens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dish_review_analysis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "status" "review_analysis_status_enum" NOT NULL DEFAULT 'pending',
    "confidence_score" DECIMAL(5,4),
    "reason" TEXT,
    "model_version" VARCHAR(50),
    "reviewed_by_admin_id" UUID,
    "manual_override" BOOLEAN NOT NULL DEFAULT false,
    "analyzed_at" TIMESTAMPTZ(6),

    CONSTRAINT "dish_review_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dish_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "order_item_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dish_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floor_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "canvas_width" INTEGER NOT NULL,
    "canvas_height" INTEGER NOT NULL,
    "background_url" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "floor_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "food_specializations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "food_specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_allergens" (
    "ingredient_id" UUID NOT NULL,
    "allergen_id" UUID NOT NULL,

    CONSTRAINT "ingredient_allergens_pkey" PRIMARY KEY ("ingredient_id","allergen_id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "unit" VARCHAR(20) NOT NULL,
    "is_vegetarian" BOOLEAN NOT NULL,
    "is_vegan" BOOLEAN NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "current_quantity" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "reorder_level" DECIMAL(10,3) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventory_item_id" UUID NOT NULL,
    "order_item_id" UUID,
    "performed_by" UUID,
    "transaction_type" "inventory_txn_type_enum" NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "quantity_before" DECIMAL(10,3) NOT NULL,
    "quantity_after" DECIMAL(10,3) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_item_ingredients" (
    "menu_item_id" UUID NOT NULL,
    "ingredient_id" UUID NOT NULL,
    "component" "ingredient_component_enum" NOT NULL DEFAULT 'main',
    "quantity_required" DECIMAL(10,3),

    CONSTRAINT "menu_item_ingredients_pkey" PRIMARY KEY ("menu_item_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "menu_item_specializations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "menu_item_id" UUID NOT NULL,
    "specialization_id" UUID NOT NULL,

    CONSTRAINT "menu_item_specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "category_id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "image_url" TEXT,
    "spice_level" "spice_level_enum" NOT NULL DEFAULT 'none',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "preparation_time_minutes" INTEGER,
    "serves_count" INTEGER NOT NULL DEFAULT 1,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "channel" VARCHAR(20) NOT NULL DEFAULT 'in_app',
    "title" VARCHAR(150) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_fulfillments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "pickup_code" VARCHAR(20) NOT NULL,
    "estimated_ready_at" TIMESTAMPTZ(6),
    "picked_up_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_fulfillments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_item_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "status" "assignment_status_enum" NOT NULL DEFAULT 'assigned',
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "order_item_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "menu_item_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "special_instructions" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "order_type" "order_type_enum" NOT NULL,
    "reservation_id" UUID,
    "status" "order_status_enum" NOT NULL DEFAULT 'draft',
    "rejection_reason" TEXT,
    "reviewed_by" UUID,
    "reviewed_at" TIMESTAMPTZ(6),
    "payment_method" "payment_method_enum",
    "payment_status" "payment_status_enum" NOT NULL DEFAULT 'unpaid',
    "subtotal" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "cancellation_reason" TEXT,
    "placed_at" TIMESTAMPTZ(6),
    "ready_at" TIMESTAMPTZ(6),
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID,
    "reservation_id" UUID,
    "method" "payment_method_enum" NOT NULL,
    "provider" VARCHAR(30),
    "transaction_id" VARCHAR(100),
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "payment_txn_status_enum" NOT NULL DEFAULT 'initiated',
    "gateway_response" JSONB,
    "received_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "device_info" VARCHAR(255),
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "payment_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "status" "refund_status_enum" NOT NULL DEFAULT 'pending',
    "processed_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_tables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "reservation_id" UUID NOT NULL,
    "table_id" UUID NOT NULL,
    "during" tstzrange NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "reservation_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "party_size" INTEGER NOT NULL,
    "reservation_time" TIMESTAMPTZ(6) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 90,
    "status" "reservation_status_enum" NOT NULL DEFAULT 'pending',
    "special_requests" TEXT,
    "cancelled_at" TIMESTAMPTZ(6),
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_review_analysis" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "review_id" UUID NOT NULL,
    "status" "review_analysis_status_enum" NOT NULL DEFAULT 'pending',
    "confidence_score" DECIMAL(5,4),
    "reason" TEXT,
    "model_version" VARCHAR(50),
    "reviewed_by_admin_id" UUID,
    "manual_override" BOOLEAN NOT NULL DEFAULT false,
    "analyzed_at" TIMESTAMPTZ(6),

    CONSTRAINT "restaurant_review_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_reviews" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_tables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "floor_plan_id" UUID NOT NULL,
    "category_id" UUID,
    "table_number" VARCHAR(10) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "pos_x" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "pos_y" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "width" DECIMAL(8,2) NOT NULL DEFAULT 80,
    "height" DECIMAL(8,2) NOT NULL DEFAULT 80,
    "rotation" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "phone" VARCHAR(20),
    "opening_time" TIME(6) NOT NULL,
    "closing_time" TIME(6) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "staff_type" "staff_type_enum" NOT NULL,
    "position" VARCHAR(50),
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_specializations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "staff_id" UUID NOT NULL,
    "specialization_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_specializations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "table_id" UUID NOT NULL,
    "staff_id" UUID NOT NULL,
    "status" "table_assignment_status_enum" NOT NULL DEFAULT 'assigned',
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "released_at" TIMESTAMPTZ(6),

    CONSTRAINT "table_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "restaurant_id" UUID NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "table_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "password_hash" TEXT NOT NULL,
    "phone" VARCHAR(20),
    "role" "user_role" NOT NULL DEFAULT 'customer',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "wallet_id" UUID NOT NULL,
    "payment_id" UUID,
    "reservation_id" UUID,
    "transaction_type" "wallet_transaction_type_enum" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "balance_before" DECIMAL(12,2) NOT NULL,
    "balance_after" DECIMAL(12,2) NOT NULL,
    "idempotency_key" VARCHAR(150),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "allergens_name_key" ON "allergens"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dish_review_analysis_review_id_key" ON "dish_review_analysis"("review_id");

-- CreateIndex
CREATE INDEX "idx_dish_review_analysis_admin" ON "dish_review_analysis"("reviewed_by_admin_id");

-- CreateIndex
CREATE INDEX "idx_dish_review_analysis_status" ON "dish_review_analysis"("status");

-- CreateIndex
CREATE UNIQUE INDEX "dish_reviews_order_item_id_key" ON "dish_reviews"("order_item_id");

-- CreateIndex
CREATE INDEX "idx_dish_reviews_customer" ON "dish_reviews"("customer_id");

-- CreateIndex
CREATE INDEX "idx_dish_reviews_menu_item" ON "dish_reviews"("menu_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "floor_plans_id_restaurant_id_key" ON "floor_plans"("id", "restaurant_id");

-- CreateIndex
CREATE UNIQUE INDEX "floor_plans_restaurant_id_name_key" ON "floor_plans"("restaurant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "one_default_floor_plan_per_restaurant" ON "floor_plans"("restaurant_id") WHERE (is_default AND is_active);

-- CreateIndex
CREATE UNIQUE INDEX "food_specializations_name_key" ON "food_specializations"("name");

-- CreateIndex
CREATE INDEX "idx_ingredient_allergens_allergen" ON "ingredient_allergens"("allergen_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE INDEX "idx_inventory_items_ingredient" ON "inventory_items"("ingredient_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_restaurant_id_ingredient_id_key" ON "inventory_items"("restaurant_id", "ingredient_id");

-- CreateIndex
CREATE INDEX "idx_inventory_tx_item" ON "inventory_transactions"("inventory_item_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_inventory_tx_order_item" ON "inventory_transactions"("order_item_id");

-- CreateIndex
CREATE INDEX "idx_inventory_tx_performed_by" ON "inventory_transactions"("performed_by");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_restaurant_id_name_key" ON "menu_categories"("restaurant_id", "name");

-- CreateIndex
CREATE INDEX "idx_menu_item_ingredients_ingredient" ON "menu_item_ingredients"("ingredient_id");

-- CreateIndex
CREATE INDEX "idx_menu_item_specializations_spec" ON "menu_item_specializations"("specialization_id");

-- CreateIndex
CREATE UNIQUE INDEX "menu_item_specializations_menu_item_id_specialization_id_key" ON "menu_item_specializations"("menu_item_id", "specialization_id");

-- CreateIndex
CREATE INDEX "idx_menu_items_category" ON "menu_items"("category_id");

-- CreateIndex
CREATE INDEX "idx_notifications_user_unread" ON "notifications"("user_id", "created_at" DESC) WHERE (NOT is_read);

-- CreateIndex
CREATE UNIQUE INDEX "order_fulfillments_order_id_key" ON "order_fulfillments"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_fulfillments_pickup_code_key" ON "order_fulfillments"("pickup_code");

-- CreateIndex
CREATE INDEX "idx_assignments_staff_status" ON "order_item_assignments"("staff_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_assignments_order_item_id_staff_id_key" ON "order_item_assignments"("order_item_id", "staff_id");

-- CreateIndex
CREATE INDEX "idx_order_items_menu_item" ON "order_items"("menu_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_id_menu_item_id_key" ON "order_items"("order_id", "menu_item_id");

-- CreateIndex
CREATE INDEX "idx_orders_branch_status" ON "orders"("restaurant_id", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_customer" ON "orders"("customer_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_orders_reservation" ON "orders"("reservation_id");

-- CreateIndex
CREATE INDEX "idx_orders_reviewed_by" ON "orders"("reviewed_by");

-- CreateIndex
CREATE UNIQUE INDEX "one_draft_order_per_customer_branch" ON "orders"("customer_id", "restaurant_id") WHERE (status = 'draft'::order_status_enum);

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");

-- CreateIndex
CREATE INDEX "idx_payments_order" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "idx_payments_received_by" ON "payments"("received_by");

-- CreateIndex
CREATE INDEX "idx_payments_reservation" ON "payments"("reservation_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_refresh_tokens_user" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "idx_refunds_payment" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "idx_refunds_processed_by" ON "refunds"("processed_by");

-- CreateIndex
CREATE INDEX "idx_reservation_tables_table" ON "reservation_tables"("table_id");

-- CreateIndex
CREATE UNIQUE INDEX "reservation_tables_reservation_id_table_id_key" ON "reservation_tables"("reservation_id", "table_id");

-- CreateIndex
CREATE INDEX "idx_reservations_branch_time" ON "reservations"("restaurant_id", "reservation_time");

-- CreateIndex
CREATE INDEX "idx_reservations_customer" ON "reservations"("customer_id", "reservation_time" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_review_analysis_review_id_key" ON "restaurant_review_analysis"("review_id");

-- CreateIndex
CREATE INDEX "idx_restaurant_review_analysis_admin" ON "restaurant_review_analysis"("reviewed_by_admin_id");

-- CreateIndex
CREATE INDEX "idx_restaurant_review_analysis_status" ON "restaurant_review_analysis"("status");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_reviews_order_id_key" ON "restaurant_reviews"("order_id");

-- CreateIndex
CREATE INDEX "idx_restaurant_reviews_customer" ON "restaurant_reviews"("customer_id");

-- CreateIndex
CREATE INDEX "idx_restaurant_tables_category" ON "restaurant_tables"("category_id");

-- CreateIndex
CREATE INDEX "idx_restaurant_tables_floor_plan" ON "restaurant_tables"("floor_plan_id");

-- CreateIndex
CREATE INDEX "idx_restaurant_tables_restaurant" ON "restaurant_tables"("restaurant_id") WHERE (is_active);

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_restaurant_id_table_number_key" ON "restaurant_tables"("restaurant_id", "table_number");

-- CreateIndex
CREATE UNIQUE INDEX "staff_user_id_key" ON "staff"("user_id");

-- CreateIndex
CREATE INDEX "idx_staff_restaurant" ON "staff"("restaurant_id", "staff_type");

-- CreateIndex
CREATE INDEX "idx_staff_specializations_spec" ON "staff_specializations"("specialization_id");

-- CreateIndex
CREATE UNIQUE INDEX "staff_specializations_staff_id_specialization_id_key" ON "staff_specializations"("staff_id", "specialization_id");

-- CreateIndex
CREATE INDEX "idx_table_assignments_staff" ON "table_assignments"("staff_id");

-- CreateIndex
CREATE INDEX "idx_table_assignments_table" ON "table_assignments"("table_id");

-- CreateIndex
CREATE UNIQUE INDEX "one_active_staff_per_table" ON "table_assignments"("table_id") WHERE (status = 'assigned'::table_assignment_status_enum);

-- CreateIndex
CREATE UNIQUE INDEX "table_categories_restaurant_id_name_key" ON "table_categories"("restaurant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_payment_id_key" ON "wallet_transactions"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_idempotency_key_key" ON "wallet_transactions"("idempotency_key");

-- CreateIndex
CREATE INDEX "idx_wallet_transactions_reservation" ON "wallet_transactions"("reservation_id");

-- CreateIndex
CREATE INDEX "idx_wallet_transactions_wallet" ON "wallet_transactions"("wallet_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- AddForeignKey
ALTER TABLE "dish_review_analysis" ADD CONSTRAINT "dish_review_analysis_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "dish_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dish_review_analysis" ADD CONSTRAINT "dish_review_analysis_reviewed_by_admin_id_fkey" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dish_reviews" ADD CONSTRAINT "dish_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dish_reviews" ADD CONSTRAINT "dish_reviews_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "dish_reviews" ADD CONSTRAINT "dish_reviews_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "floor_plans" ADD CONSTRAINT "floor_plans_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_allergen_id_fkey" FOREIGN KEY ("allergen_id") REFERENCES "allergens"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ingredient_allergens" ADD CONSTRAINT "ingredient_allergens_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_item_ingredients" ADD CONSTRAINT "menu_item_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_item_ingredients" ADD CONSTRAINT "menu_item_ingredients_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_item_specializations" ADD CONSTRAINT "menu_item_specializations_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_item_specializations" ADD CONSTRAINT "menu_item_specializations_specialization_id_fkey" FOREIGN KEY ("specialization_id") REFERENCES "food_specializations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_item_assignments" ADD CONSTRAINT "order_item_assignments_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_item_assignments" ADD CONSTRAINT "order_item_assignments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_fkey" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservation_tables" ADD CONSTRAINT "reservation_tables_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservation_tables" ADD CONSTRAINT "reservation_tables_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_review_analysis" ADD CONSTRAINT "restaurant_review_analysis_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "restaurant_reviews"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_review_analysis" ADD CONSTRAINT "restaurant_review_analysis_reviewed_by_admin_id_fkey" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_reviews" ADD CONSTRAINT "restaurant_reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_reviews" ADD CONSTRAINT "restaurant_reviews_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "table_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_floor_plan_id_restaurant_id_fkey" FOREIGN KEY ("floor_plan_id", "restaurant_id") REFERENCES "floor_plans"("id", "restaurant_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff" ADD CONSTRAINT "staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_specializations" ADD CONSTRAINT "staff_specializations_specialization_id_fkey" FOREIGN KEY ("specialization_id") REFERENCES "food_specializations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staff_specializations" ADD CONSTRAINT "staff_specializations_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "table_assignments" ADD CONSTRAINT "table_assignments_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "table_assignments" ADD CONSTRAINT "table_assignments_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "table_categories" ADD CONSTRAINT "table_categories_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
