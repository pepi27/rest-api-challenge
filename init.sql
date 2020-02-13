CREATE DATABASE petar_polycade;

CREATE TABLE pricing (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE price (
  id BIGSERIAL PRIMARY KEY,
  price numeric NOT NULL,
  name VARCHAR(255) NOT NULL,
  value numeric NOT NULL,
  pricing_id BIGINT REFERENCES pricing(id)
);

CREATE TABLE machine (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pricing_id BIGINT REFERENCES pricing(id)
);

INSERT INTO machine (id, name) VALUES (1, 'Machine 1');
