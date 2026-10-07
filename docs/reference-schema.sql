


CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('customer','staff','admin');
CREATE TYPE staff_type_enum AS ENUM ('chef','waiter','manager');
CREATE TYPE spice_level_enum AS ENUM ('none','mild','medium','hot','extra_hot');
CREATE TYPE ingredient_component_enum AS ENUM ('main','filling','coating','seasoning','sauce','garnish');
CREATE TYPE reservation_status_enum AS ENUM ('pending','confirmed','seated','completed','cancelled','no_show');
CREATE TYPE order_type_enum AS ENUM ('dine_in','takeaway');
CREATE TYPE order_status_enum AS ENUM ('draft','pending','accepted','rejected','preparing','ready','served','completed','cancelled');
CREATE TYPE payment_method_enum AS ENUM ('cash','card','wallet');
CREATE TYPE payment_status_enum AS ENUM ('unpaid','paid','refunded','partially_refunded');
CREATE TYPE payment_txn_status_enum AS ENUM ('initiated','succeeded','failed');
CREATE TYPE refund_status_enum AS ENUM ('pending','processed','failed');
CREATE TYPE review_analysis_status_enum AS ENUM ('pending','genuine','suspicious','confirmed_fake');
CREATE TYPE assignment_status_enum AS ENUM ('assigned','in_progress','done');
CREATE TYPE table_assignment_status_enum AS ENUM ('assigned','released');
CREATE TYPE inventory_txn_type_enum AS ENUM ('purchase','usage','adjustment','waste');
CREATE TYPE wallet_transaction_type_enum AS ENUM ('credit','debit','refund');

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar(100) NOT NULL,
  email         varchar(255) UNIQUE,
  password_hash text NOT NULL,
  phone         varchar(20) UNIQUE,
  role          user_role NOT NULL DEFAULT 'customer',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_contact_chk CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  device_info varchar(255),
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE restaurants (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         varchar(150) NOT NULL,
  description  text,
  address      text NOT NULL,
  latitude     decimal(9,6) CHECK (latitude BETWEEN -90 AND 90),
  longitude    decimal(9,6) CHECK (longitude BETWEEN -180 AND 180),
  phone        varchar(20),
  opening_time time NOT NULL,
  closing_time time NOT NULL,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE staff (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL UNIQUE REFERENCES users(id),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  staff_type    staff_type_enum NOT NULL,
  position      varchar(50),
  is_available  boolean NOT NULL DEFAULT true,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE food_specializations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(100) NOT NULL UNIQUE,
  description text,
  is_active   boolean NOT NULL DEFAULT true
);

CREATE TABLE staff_specializations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id          uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  specialization_id uuid NOT NULL REFERENCES food_specializations(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (staff_id, specialization_id)
);

CREATE TABLE allergens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(50) NOT NULL UNIQUE,
  description text
);

INSERT INTO allergens (name) VALUES
  ('peanuts'),('tree_nuts'),('soy'),('wheat_gluten'),('egg'),
  ('milk'),('fish'),('shellfish'),('sesame');

CREATE TABLE ingredients (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          varchar(150) NOT NULL UNIQUE,
  unit          varchar(20) NOT NULL,
  is_vegetarian boolean NOT NULL,
  is_vegan      boolean NOT NULL,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ingredients_vegan_implies_veg_chk CHECK (NOT is_vegan OR is_vegetarian)
);

CREATE TABLE ingredient_allergens (
  ingredient_id uuid NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  allergen_id   uuid NOT NULL REFERENCES allergens(id),
  PRIMARY KEY (ingredient_id, allergen_id)
);

CREATE TABLE menu_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  name          varchar(100) NOT NULL,
  description   text,
  display_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, name)
);

CREATE TABLE menu_items (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id              uuid NOT NULL REFERENCES menu_categories(id),
  name                     varchar(150) NOT NULL,
  description              text,
  price                    decimal(10,2) NOT NULL CHECK (price >= 0),
  image_url                text,
  spice_level              spice_level_enum NOT NULL DEFAULT 'none',
  is_available             boolean NOT NULL DEFAULT true,
  preparation_time_minutes integer CHECK (preparation_time_minutes > 0),
  serves_count             integer NOT NULL DEFAULT 1 CHECK (serves_count > 0),
  avg_rating               decimal(3,2) NOT NULL DEFAULT 0 CHECK (avg_rating BETWEEN 0 AND 5),
  review_count             integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE menu_item_specializations (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id      uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  specialization_id uuid NOT NULL REFERENCES food_specializations(id),
  UNIQUE (menu_item_id, specialization_id)
);

CREATE TABLE menu_item_ingredients (
  menu_item_id      uuid NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id     uuid NOT NULL REFERENCES ingredients(id),
  component         ingredient_component_enum NOT NULL DEFAULT 'main',
  quantity_required decimal(10,3) CHECK (quantity_required > 0),
  PRIMARY KEY (menu_item_id, ingredient_id)
);

CREATE VIEW menu_item_dietary_info AS
SELECT
  mi.id AS menu_item_id,
  COALESCE(bool_and(ing.is_vegetarian), false) AS is_vegetarian,
  COALESCE(bool_and(ing.is_vegan), false) AS is_vegan,
  COALESCE(array_agg(DISTINCT al.name) FILTER (WHERE al.name IS NOT NULL), '{}') AS allergens
FROM menu_items mi
LEFT JOIN menu_item_ingredients mii ON mii.menu_item_id = mi.id
LEFT JOIN ingredients ing ON ing.id = mii.ingredient_id
LEFT JOIN ingredient_allergens ia ON ia.ingredient_id = ing.id
LEFT JOIN allergens al ON al.id = ia.allergen_id
GROUP BY mi.id;

CREATE TABLE table_categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  name          varchar(50) NOT NULL,
  description   text,
  display_order integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  UNIQUE (restaurant_id, name)
);

CREATE TABLE floor_plans (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id  uuid NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name           varchar(100) NOT NULL,
  canvas_width   integer NOT NULL CHECK (canvas_width > 0),
  canvas_height  integer NOT NULL CHECK (canvas_height > 0),
  background_url text,
  is_default     boolean NOT NULL DEFAULT false,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, name),
  UNIQUE (id, restaurant_id)
);

CREATE UNIQUE INDEX one_default_floor_plan_per_restaurant
ON floor_plans (restaurant_id) WHERE is_default AND is_active;

CREATE TABLE restaurant_tables (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  floor_plan_id uuid NOT NULL,
  category_id   uuid REFERENCES table_categories(id),
  table_number  varchar(10) NOT NULL,
  capacity      integer NOT NULL CHECK (capacity > 0),
  pos_x         decimal(8,2) NOT NULL DEFAULT 0 CHECK (pos_x >= 0),
  pos_y         decimal(8,2) NOT NULL DEFAULT 0 CHECK (pos_y >= 0),
  width         decimal(8,2) NOT NULL DEFAULT 80 CHECK (width > 0),
  height        decimal(8,2) NOT NULL DEFAULT 80 CHECK (height > 0),
  rotation      decimal(6,2) NOT NULL DEFAULT 0 CHECK (rotation >= 0 AND rotation < 360),
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, table_number),
  FOREIGN KEY (floor_plan_id, restaurant_id)
    REFERENCES floor_plans(id, restaurant_id) ON DELETE RESTRICT
);

CREATE TABLE table_assignments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id    uuid NOT NULL REFERENCES restaurant_tables(id),
  staff_id    uuid NOT NULL REFERENCES staff(id),
  status      table_assignment_status_enum NOT NULL DEFAULT 'assigned',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  released_at timestamptz
);

CREATE TABLE reservations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         uuid NOT NULL REFERENCES users(id),
  restaurant_id       uuid NOT NULL REFERENCES restaurants(id),
  party_size          integer NOT NULL CHECK (party_size > 0),
  reservation_time    timestamptz NOT NULL,
  duration_minutes    integer NOT NULL DEFAULT 90 CHECK (duration_minutes > 0),
  status              reservation_status_enum NOT NULL DEFAULT 'pending',
  special_requests    text,
  cancelled_at        timestamptz,
  cancellation_reason text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reservation_tables (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  table_id       uuid NOT NULL REFERENCES restaurant_tables(id),
  during         tstzrange NOT NULL CHECK (NOT isempty(during)),
  is_active      boolean NOT NULL DEFAULT true,
  UNIQUE (reservation_id, table_id),
  CONSTRAINT no_double_booking
    EXCLUDE USING gist (table_id WITH =, during WITH &&) WHERE (is_active)
);

CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id         uuid NOT NULL REFERENCES users(id),
  restaurant_id       uuid NOT NULL REFERENCES restaurants(id),
  order_type          order_type_enum NOT NULL,
  reservation_id      uuid REFERENCES reservations(id),
  status              order_status_enum NOT NULL DEFAULT 'draft',
  rejection_reason    text,
  reviewed_by         uuid REFERENCES staff(id),
  reviewed_at         timestamptz,
  payment_method      payment_method_enum,
  payment_status      payment_status_enum NOT NULL DEFAULT 'unpaid',
  subtotal            decimal(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax                 decimal(10,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total               decimal(10,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes               text,
  cancellation_reason text,
  placed_at           timestamptz,
  ready_at            timestamptz,
  completed_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_reservation_only_dine_in_chk
    CHECK (order_type = 'dine_in' OR reservation_id IS NULL)
);

CREATE TABLE order_items (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id         uuid NOT NULL REFERENCES menu_items(id),
  quantity             integer NOT NULL CHECK (quantity > 0),
  unit_price           decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal             decimal(10,2) NOT NULL,
  special_instructions text,
  UNIQUE (order_id, menu_item_id),
  CONSTRAINT order_items_subtotal_chk CHECK (subtotal = quantity * unit_price)
);

CREATE TABLE order_item_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  staff_id      uuid NOT NULL REFERENCES staff(id),
  status        assignment_status_enum NOT NULL DEFAULT 'assigned',
  assigned_at   timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  completed_at  timestamptz,
  UNIQUE (order_item_id, staff_id)
);

CREATE TABLE payments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid REFERENCES orders(id),
  reservation_id   uuid REFERENCES reservations(id),
  method           payment_method_enum NOT NULL,
  provider         varchar(30),
  transaction_id   varchar(100) UNIQUE,
  amount           decimal(10,2) NOT NULL CHECK (amount > 0),
  status           payment_txn_status_enum NOT NULL DEFAULT 'initiated',
  gateway_response jsonb,
  received_by      uuid REFERENCES staff(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payments_reference_chk CHECK (order_id IS NOT NULL OR reservation_id IS NOT NULL)
);

CREATE TABLE refunds (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id   uuid NOT NULL REFERENCES payments(id),
  amount       decimal(10,2) NOT NULL CHECK (amount > 0),
  reason       text,
  status       refund_status_enum NOT NULL DEFAULT 'pending',
  processed_by uuid REFERENCES staff(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wallets (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance    decimal(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wallet_transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id         uuid NOT NULL REFERENCES wallets(id),
  payment_id        uuid UNIQUE REFERENCES payments(id),
  reservation_id    uuid REFERENCES reservations(id),
  transaction_type  wallet_transaction_type_enum NOT NULL,
  amount            decimal(12,2) NOT NULL CHECK (amount > 0),
  balance_before    decimal(12,2) NOT NULL CHECK (balance_before >= 0),
  balance_after     decimal(12,2) NOT NULL CHECK (balance_after >= 0),
  idempotency_key   varchar(150) UNIQUE,
  description       text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transaction_balance_chk CHECK (
    (transaction_type = 'debit' AND balance_after = balance_before - amount) OR
    (transaction_type IN ('credit','refund') AND balance_after = balance_before + amount)
  )
);

CREATE TABLE order_fulfillments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           uuid NOT NULL UNIQUE REFERENCES orders(id),
  pickup_code        varchar(20) NOT NULL UNIQUE,
  estimated_ready_at timestamptz,
  picked_up_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE restaurant_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id),
  order_id    uuid NOT NULL UNIQUE REFERENCES orders(id),
  rating      integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE restaurant_review_analysis (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id            uuid NOT NULL UNIQUE REFERENCES restaurant_reviews(id) ON DELETE CASCADE,
  status               review_analysis_status_enum NOT NULL DEFAULT 'pending',
  confidence_score     decimal(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
  reason               text,
  model_version        varchar(50),
  reviewed_by_admin_id uuid REFERENCES users(id),
  manual_override      boolean NOT NULL DEFAULT false,
  analyzed_at          timestamptz
);

CREATE TABLE dish_reviews (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id   uuid NOT NULL REFERENCES users(id),
  order_item_id uuid NOT NULL UNIQUE REFERENCES order_items(id),
  menu_item_id  uuid NOT NULL REFERENCES menu_items(id),
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dish_review_analysis (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id            uuid NOT NULL UNIQUE REFERENCES dish_reviews(id) ON DELETE CASCADE,
  status               review_analysis_status_enum NOT NULL DEFAULT 'pending',
  confidence_score     decimal(5,4) CHECK (confidence_score BETWEEN 0 AND 1),
  reason               text,
  model_version        varchar(50),
  reviewed_by_admin_id uuid REFERENCES users(id),
  manual_override      boolean NOT NULL DEFAULT false,
  analyzed_at          timestamptz
);

CREATE TABLE inventory_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    uuid NOT NULL REFERENCES restaurants(id),
  ingredient_id    uuid NOT NULL REFERENCES ingredients(id),
  current_quantity decimal(10,3) NOT NULL DEFAULT 0 CHECK (current_quantity >= 0),
  reorder_level    decimal(10,3) NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (restaurant_id, ingredient_id)
);

CREATE TABLE inventory_transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id uuid NOT NULL REFERENCES inventory_items(id),
  order_item_id     uuid REFERENCES order_items(id),
  performed_by      uuid REFERENCES staff(id),
  transaction_type  inventory_txn_type_enum NOT NULL,
  quantity          decimal(10,3) NOT NULL,
  quantity_before   decimal(10,3) NOT NULL CHECK (quantity_before >= 0),
  quantity_after    decimal(10,3) NOT NULL CHECK (quantity_after >= 0),
  reason            text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       varchar(50) NOT NULL,
  channel    varchar(20) NOT NULL DEFAULT 'in_app',
  title      varchar(150) NOT NULL,
  message    text NOT NULL,
  is_read    boolean NOT NULL DEFAULT false,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX one_draft_order_per_customer_branch ON orders (customer_id, restaurant_id) WHERE status = 'draft';
CREATE UNIQUE INDEX one_active_staff_per_table ON table_assignments (table_id) WHERE status = 'assigned';

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
CREATE INDEX idx_staff_restaurant ON staff (restaurant_id, staff_type);
CREATE INDEX idx_staff_specializations_spec ON staff_specializations (specialization_id);
CREATE INDEX idx_menu_items_category ON menu_items (category_id);
CREATE INDEX idx_menu_item_specializations_spec ON menu_item_specializations (specialization_id);
CREATE INDEX idx_menu_item_ingredients_ingredient ON menu_item_ingredients (ingredient_id);
CREATE INDEX idx_ingredient_allergens_allergen ON ingredient_allergens (allergen_id);
CREATE INDEX idx_restaurant_tables_restaurant ON restaurant_tables (restaurant_id) WHERE is_active;
CREATE INDEX idx_restaurant_tables_floor_plan ON restaurant_tables (floor_plan_id);
CREATE INDEX idx_restaurant_tables_category ON restaurant_tables (category_id);
CREATE INDEX idx_table_assignments_staff ON table_assignments (staff_id);
CREATE INDEX idx_table_assignments_table ON table_assignments (table_id);
CREATE INDEX idx_reservations_branch_time ON reservations (restaurant_id, reservation_time);
CREATE INDEX idx_reservations_customer ON reservations (customer_id, reservation_time DESC);
CREATE INDEX idx_reservation_tables_table ON reservation_tables (table_id);
CREATE INDEX idx_orders_branch_status ON orders (restaurant_id, status, created_at DESC);
CREATE INDEX idx_orders_customer ON orders (customer_id, created_at DESC);
CREATE INDEX idx_orders_reservation ON orders (reservation_id);
CREATE INDEX idx_orders_reviewed_by ON orders (reviewed_by);
CREATE INDEX idx_order_items_menu_item ON order_items (menu_item_id);
CREATE INDEX idx_assignments_staff_status ON order_item_assignments (staff_id, status);
CREATE INDEX idx_payments_order ON payments (order_id);
CREATE INDEX idx_payments_reservation ON payments (reservation_id);
CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions (wallet_id, created_at DESC);
CREATE INDEX idx_wallet_transactions_reservation ON wallet_transactions (reservation_id);
CREATE INDEX idx_refunds_payment ON refunds (payment_id);
CREATE INDEX idx_refunds_processed_by ON refunds (processed_by);
CREATE INDEX idx_payments_received_by ON payments (received_by);
CREATE INDEX idx_restaurant_reviews_customer ON restaurant_reviews (customer_id);
CREATE INDEX idx_restaurant_review_analysis_status ON restaurant_review_analysis (status);
CREATE INDEX idx_restaurant_review_analysis_admin ON restaurant_review_analysis (reviewed_by_admin_id);
CREATE INDEX idx_dish_reviews_menu_item ON dish_reviews (menu_item_id);
CREATE INDEX idx_dish_reviews_customer ON dish_reviews (customer_id);
CREATE INDEX idx_dish_review_analysis_status ON dish_review_analysis (status);
CREATE INDEX idx_dish_review_analysis_admin ON dish_review_analysis (reviewed_by_admin_id);
CREATE INDEX idx_inventory_items_ingredient ON inventory_items (ingredient_id);
CREATE INDEX idx_inventory_tx_item ON inventory_transactions (inventory_item_id, created_at DESC);
CREATE INDEX idx_inventory_tx_order_item ON inventory_transactions (order_item_id);
CREATE INDEX idx_inventory_tx_performed_by ON inventory_transactions (performed_by);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, created_at DESC) WHERE NOT is_read;