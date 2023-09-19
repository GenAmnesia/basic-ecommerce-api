/*******************************************************************************
   Basic Ecommerce Database
   Script: ./sql/schema/create-tables.sql
   Description: Creates the database for the project.
   DB Server: PostgreSql
   Author: Gennaro Mormile
********************************************************************************/

/*******************************************************************************
   Types/Enumerators
********************************************************************************/

CREATE TYPE country_code AS ENUM ('it', 'uk', 'eu');
CREATE TYPE product_status AS ENUM ('available', 'not_available');
CREATE TYPE order_status AS ENUM ('created', 'shipped', 'refused', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'declined', 'refunded');


/*******************************************************************************
   Create Tables
********************************************************************************/

CREATE TABLE "products" (
    "id" serial PRIMARY KEY,
    "name" varchar(255) NOT NULL,
    "description" text,
    "category_id" integer,
    "main_photo_id" integer,
    "tags" varchar(20)[],
    "price" numeric(8, 2) NOT NULL,
    "discount_price" numeric(8, 2),
    "status" product_status NOT NULL DEFAULT 'available',
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp,
    "deleted_at" timestamp
);

CREATE TABLE "product_photos" (
    "id" serial PRIMARY KEY,
    "product_id" integer,
    "url" text NOT NULL UNIQUE,
    "caption" varchar(255)
);

CREATE TABLE "categories" (
    "id" serial PRIMARY KEY,
    "name" varchar(50) NOT NULL,
    "parent_id" integer
);

CREATE TABLE "users" (
    "id" serial PRIMARY KEY,
    "first_name" varchar(255),
    "last_name" varchar(255),
    "email" varchar(255) NOT NULL UNIQUE,
    "password" text,
    "google_id" varchar(255),
    "google_token" text,
    "default_address" integer,
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "admins" (
    "user_id" integer PRIMARY KEY
);

CREATE TABLE "shipping_fees" (
    "id" serial PRIMARY KEY,
    "method" varchar(255) NOT NULL,
    "fee" numeric(8, 2) NOT NULL,
    "country" country_code NOT NULL,
    "postal_code" varchar(20)
);

CREATE TABLE "shipping_addresses" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL,
    "recipient_name" varchar(255) NOT NULL,
    "street_address" varchar(255) NOT NULL,
    "city" varchar(255) NOT NULL,
    "state_province" varchar(255) NOT NULL,
    "postal_code" varchar(20) NOT NULL,
    "country" country_code NOT NULL DEFAULT 'it',
    "phone_number" varchar(50) NOT NULL,
    "notes" varchar(255),
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" timestamp,
    CONSTRAINT unique_shipping_address UNIQUE ("id", "user_id")
);

CREATE TABLE "orders" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL,
    "status" order_status NOT NULL,
    "address_id" integer NOT NULL,
    "shipping_fee" numeric(8, 2) NOT NULL,
    "total_amount" numeric(8, 2) NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp
);

CREATE TABLE "order_items" (
    "id" serial PRIMARY KEY,
    "order_id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "product_name" varchar(255) NOT NULL,
    "quantity" integer NOT NULL,
    "price_per_item" numeric(8, 2) NOT NULL,
    CONSTRAINT unique_order_item UNIQUE (order_id, product_id)
);

CREATE TABLE "cart_items" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "quantity" integer NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp,
    CONSTRAINT unique_cart_item UNIQUE (user_id, product_id)
);

CREATE TABLE "payments" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL,
    "order_id" integer NOT NULL,
    "amount" numeric(8, 2) NOT NULL,
    "timestamp" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" varchar(50) NOT NULL,
    "status" payment_status NOT NULL
);

CREATE TABLE "reviews" (
    "id" serial PRIMARY KEY,
    "rating" integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    "user_id" integer NOT NULL,
    "product_id" integer NOT NULL,
    "description" varchar(1000),
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "audit_log" (
    "id" serial PRIMARY KEY,
    "user_id" integer,
    "action_type" varchar(50) NOT NULL,
    "action_description" text,
    "timestamp" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "error_log" (
    "id" serial PRIMARY KEY,
    "error_message" text NOT NULL,
    "timestamp" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/*******************************************************************************
   Create Foreign Keys
********************************************************************************/

ALTER TABLE "users"
    ADD FOREIGN KEY ("default_address") REFERENCES "shipping_addresses" ("id") ON DELETE SET NULL;

ALTER TABLE "admins"
    ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "product_photos"
    ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;

ALTER TABLE "products"
    ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL,
    ADD FOREIGN KEY ("main_photo_id") REFERENCES "product_photos" ("id") ON DELETE SET NULL;

ALTER TABLE "categories"
    ADD FOREIGN KEY ("parent_id") REFERENCES "categories" ("id") ON DELETE SET NULL;

ALTER TABLE "shipping_addresses"
    ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;

ALTER TABLE "orders"
    ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    ADD FOREIGN KEY ("address_id", "user_id") REFERENCES "shipping_addresses" ("id", "user_id") ON DELETE RESTRICT ON UPDATE RESTRICT;

ALTER TABLE "order_items"
    ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE,
    ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL;

ALTER TABLE "cart_items"
    ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE SET NULL;

ALTER TABLE "payments"
    ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE;

ALTER TABLE "reviews"
    ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
    ADD FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE;

/*******************************************************************************
   Functions
********************************************************************************/

-- Update the timestamp on a updated_at row when applied.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update total_amount for orders
CREATE OR REPLACE FUNCTION update_order_total_amount()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE "orders" AS o
    SET "total_amount" = (
        SELECT SUM("price_per_item")
        FROM "order_items"
        WHERE "order_id" = NEW."order_id"
    )
    WHERE o."id" = NEW."order_id";
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;



/*******************************************************************************
   Triggers
********************************************************************************/

-- Auto-updates updated_at timestamps
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON cart_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Auto-updates "total_amount" in "orders" after changes in "order_items"
CREATE TRIGGER update_order_total_amount
AFTER INSERT OR UPDATE ON "order_items"
FOR EACH ROW
EXECUTE FUNCTION update_order_total_amount();


/*******************************************************************************
   Misc
********************************************************************************/

-- Revokes the permission to update the "total_amount" column on the "orders" table for the public role
REVOKE UPDATE ("total_amount") ON TABLE "orders" FROM PUBLIC;





