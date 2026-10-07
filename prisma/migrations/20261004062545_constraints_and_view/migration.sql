-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. CHECK constraints

-- users
ALTER TABLE users
  ADD CONSTRAINT users_contact_chk CHECK (email IS NOT NULL OR phone IS NOT NULL);

-- restaurants
ALTER TABLE restaurants
  ADD CONSTRAINT restaurants_latitude_check CHECK (latitude BETWEEN -90 AND 90),
  ADD CONSTRAINT restaurants_longitude_check CHECK (longitude BETWEEN -180 AND 180);

-- ingredients
ALTER TABLE ingredients
  ADD CONSTRAINT ingredients_vegan_implies_veg_chk CHECK (NOT is_vegan OR is_vegetarian);

-- menu_items
ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_price_check CHECK (price >= 0),
  ADD CONSTRAINT menu_items_preparation_time_minutes_check CHECK (preparation_time_minutes > 0),
  ADD CONSTRAINT menu_items_serves_count_check CHECK (serves_count > 0),
  ADD CONSTRAINT menu_items_avg_rating_check CHECK (avg_rating BETWEEN 0 AND 5),
  ADD CONSTRAINT menu_items_review_count_check CHECK (review_count >= 0);

-- menu_item_ingredients
ALTER TABLE menu_item_ingredients
  ADD CONSTRAINT menu_item_ingredients_quantity_required_check CHECK (quantity_required > 0);

-- floor_plans
ALTER TABLE floor_plans
  ADD CONSTRAINT floor_plans_canvas_width_check CHECK (canvas_width > 0),
  ADD CONSTRAINT floor_plans_canvas_height_check CHECK (canvas_height > 0);

-- restaurant_tables
ALTER TABLE restaurant_tables
  ADD CONSTRAINT restaurant_tables_capacity_check CHECK (capacity > 0),
  ADD CONSTRAINT restaurant_tables_pos_x_check CHECK (pos_x >= 0),
  ADD CONSTRAINT restaurant_tables_pos_y_check CHECK (pos_y >= 0),
  ADD CONSTRAINT restaurant_tables_width_check CHECK (width > 0),
  ADD CONSTRAINT restaurant_tables_height_check CHECK (height > 0),
  ADD CONSTRAINT restaurant_tables_rotation_check CHECK (rotation >= 0 AND rotation < 360);

-- reservations
ALTER TABLE reservations
  ADD CONSTRAINT reservations_party_size_check CHECK (party_size > 0),
  ADD CONSTRAINT reservations_duration_minutes_check CHECK (duration_minutes > 0);

-- reservation_tables
ALTER TABLE reservation_tables
  ADD CONSTRAINT reservation_tables_during_check CHECK (NOT isempty(during));

-- orders
ALTER TABLE orders
  ADD CONSTRAINT orders_subtotal_check CHECK (subtotal >= 0),
  ADD CONSTRAINT orders_tax_check CHECK (tax >= 0),
  ADD CONSTRAINT orders_total_check CHECK (total >= 0),
  ADD CONSTRAINT orders_reservation_only_dine_in_chk
    CHECK (order_type = 'dine_in' OR reservation_id IS NULL);

-- order_items
ALTER TABLE order_items
  ADD CONSTRAINT order_items_quantity_check CHECK (quantity > 0),
  ADD CONSTRAINT order_items_unit_price_check CHECK (unit_price >= 0),
  ADD CONSTRAINT order_items_subtotal_chk CHECK (subtotal = quantity * unit_price);

-- payments
ALTER TABLE payments
  ADD CONSTRAINT payments_amount_check CHECK (amount > 0),
  ADD CONSTRAINT payments_reference_chk CHECK (order_id IS NOT NULL OR reservation_id IS NOT NULL);

-- refunds
ALTER TABLE refunds
  ADD CONSTRAINT refunds_amount_check CHECK (amount > 0);

-- wallets
ALTER TABLE wallets
  ADD CONSTRAINT wallets_balance_check CHECK (balance >= 0);

-- wallet_transactions
ALTER TABLE wallet_transactions
  ADD CONSTRAINT wallet_transactions_amount_check CHECK (amount > 0),
  ADD CONSTRAINT wallet_transactions_balance_before_check CHECK (balance_before >= 0),
  ADD CONSTRAINT wallet_transactions_balance_after_check CHECK (balance_after >= 0),
  ADD CONSTRAINT wallet_transaction_balance_chk CHECK (
    (transaction_type = 'debit' AND balance_after = balance_before - amount) OR
    (transaction_type IN ('credit', 'refund') AND balance_after = balance_before + amount)
  );

-- restaurant_reviews
ALTER TABLE restaurant_reviews
  ADD CONSTRAINT restaurant_reviews_rating_check CHECK (rating BETWEEN 1 AND 5);

-- restaurant_review_analysis
ALTER TABLE restaurant_review_analysis
  ADD CONSTRAINT restaurant_review_analysis_confidence_score_check
    CHECK (confidence_score BETWEEN 0 AND 1);

-- dish_reviews
ALTER TABLE dish_reviews
  ADD CONSTRAINT dish_reviews_rating_check CHECK (rating BETWEEN 1 AND 5);

-- dish_review_analysis
ALTER TABLE dish_review_analysis
  ADD CONSTRAINT dish_review_analysis_confidence_score_check
    CHECK (confidence_score BETWEEN 0 AND 1);

-- inventory_items
ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_items_current_quantity_check CHECK (current_quantity >= 0),
  ADD CONSTRAINT inventory_items_reorder_level_check CHECK (reorder_level >= 0);

-- inventory_transactions
ALTER TABLE inventory_transactions
  ADD CONSTRAINT inventory_transactions_quantity_before_check CHECK (quantity_before >= 0),
  ADD CONSTRAINT inventory_transactions_quantity_after_check CHECK (quantity_after >= 0);

-- 3. Exclusion constraint: no overlapping active bookings per table
ALTER TABLE reservation_tables
  ADD CONSTRAINT no_double_booking
  EXCLUDE USING gist (table_id WITH =, during WITH &&) WHERE (is_active);

-- 4. View: dietary info calculated from ingredients
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