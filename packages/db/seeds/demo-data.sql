-- Seed demo data for keyword "tester" (and a few related keywords)
-- This data is clearly labeled with `source: "demo"` and `confidence: 0.3`
-- when used in the search flow. UI must display a "DEMO MODE" badge.

-- 5 demo shops (Indonesian-style electronics stores)
INSERT OR IGNORE INTO sh_demoShops
  ("id", "shopeeShopId", "name", "shopUrl", "statusLabels", "primaryStatus", "rating", "ratingCount", "responseRate", "responseTime", "followerCount", "productCount", "joinedAgeText", "location", "createdAt", "updatedAt")
VALUES
  ('demo_shp_001', 'demo-shop-001', 'TokoTools Official', 'https://shopee.co.id/demo-shop-001', '["MALL","Official Brand Store"]', 'MALL', 4.9, 12500, 99, 'dalam 1 jam', 125000, 350, '5 tahun', 'DKI Jakarta', '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_shp_002', 'demo-shop-002', 'Elektronik Murah', 'https://shopee.co.id/demo-shop-002', '["STAR"]', 'STAR', 4.7, 3400, 95, 'beberapa jam', 45000, 120, '3 tahun', 'DKI Jakarta', '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_shp_003', 'demo-shop-003', 'Instrumen Jaya', 'https://shopee.co.id/demo-shop-003', '["OFFICIAL"]', 'OFFICIAL', 4.95, 8700, 98, 'dalam 1 jam', 280000, 180, '7 tahun', 'DKI Jakarta', '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_shp_004', 'demo-shop-004', 'Gadget Store', 'https://shopee.co.id/demo-shop-004', '["REGULAR"]', 'REGULAR', 4.5, 850, 88, '1-2 hari', 12000, 60, '2 tahun', 'DKI Jakarta', '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_shp_005', 'demo-shop-005', 'TechShop Pro', 'https://shopee.co.id/demo-shop-005', '["STARPLUS"]', 'STARPLUS', 4.85, 5600, 97, 'beberapa jam', 87000, 220, '4 tahun', 'DKI Jakarta', '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z');

-- Demo keywords
INSERT OR IGNORE INTO sh_demoKeywords
  ("id", "keyword", "displayName", "description", "isEnabled", "createdAt", "updatedAt")
VALUES
  ('demo_kw_tester', 'tester', 'Multimeter / Tester Demo', 'Demo data for digital multimeter / tester search', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_kw_mouse', 'mouse', 'Mouse Demo', 'Demo data for wireless mouse search', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_kw_laptop', 'laptop', 'Laptop Demo', 'Demo data for laptop search', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_kw_tv', 'tv', 'TV Demo', 'Demo data for TV search', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_kw_headphone', 'headphone', 'Headphone Demo', 'Demo data for headphone search', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z');

-- Demo products for "tester" (5 multimeter products, one per shop)
INSERT OR IGNORE INTO sh_demoProducts
  ("id", "shopeeItemId", "shopeeShopId", "title", "brand", "category", "originalUrl", "canonicalUrl", "imageUrl", "priceMin", "priceMax", "rating", "reviewCount", "soldCount", "shippedFrom", "description", "weightGrams", "demoKeyword", "demoPosition", "createdAt", "updatedAt")
VALUES
  ('demo_prd_001', 'demo-item-001', 'demo-shop-001', 'ProTool Digital Multimeter', 'ProTool', 'Alat Ukur', 'https://shopee.co.id/demo-shop-001/demo-item-001', 'https://shopee.co.id/demo-shop-001/demo-item-001', NULL, 85000, 125000, 4.8, 2340, 12500, 'DKI Jakarta', 'Multimeter digital dengan akurasi tinggi, layar LCD besar, auto range, TRUE RMS.', 350, 'tester', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_002', 'demo-item-002', 'demo-shop-002', 'BasicTest Analog Tester', 'BasicTest', 'Alat Ukur', 'https://shopee.co.id/demo-shop-002/demo-item-002', 'https://shopee.co.id/demo-shop-002/demo-item-002', NULL, 45000, 65000, 4.6, 890, 4200, 'DKI Jakarta', 'Tester analog ekonomis, cocok untuk hobi dan pemula. Akurasi ±2%.', 180, 'tester', 2, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_003', 'demo-item-003', 'demo-shop-003', 'ProMeasure Pro Multimeter', 'ProMeasure', 'Alat Ukur Profesional', 'https://shopee.co.id/demo-shop-003/demo-item-003', 'https://shopee.co.id/demo-shop-003/demo-item-003', NULL, 215000, 280000, 4.9, 670, 1100, 'DKI Jakarta', 'Multimeter profesional dengan sertifikat kalibrasi, TRUE RMS, CAT III 600V.', 720, 'tester', 3, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_004', 'demo-item-004', 'demo-shop-004', 'NoBrand Basic Multimeter', 'NoBrand', 'Alat Ukur', 'https://shopee.co.id/demo-shop-004/demo-item-004', 'https://shopee.co.id/demo-shop-004/demo-item-004', NULL, 35000, 55000, 4.3, 450, 2100, 'DKI Jakarta', 'Multimeter basic, fungsi standar, harga terjangkau. Cocok untuk pemula.', 120, 'tester', 4, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_005', 'demo-item-005', 'demo-shop-005', 'TechTest Smart Multimeter', 'TechTest', 'Alat Ukur', 'https://shopee.co.id/demo-shop-005/demo-item-005', 'https://shopee.co.id/demo-shop-005/demo-item-005', NULL, 155000, 195000, 4.7, 1280, 5600, 'DKI Jakarta', 'Tester digital dengan Bluetooth, simpan hasil ke smartphone via app. CAT II.', 280, 'tester', 5, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z');

-- Demo products for "mouse" (3 wireless mice)
INSERT OR IGNORE INTO sh_demoProducts
  ("id", "shopeeItemId", "shopeeShopId", "title", "brand", "category", "originalUrl", "canonicalUrl", "imageUrl", "priceMin", "priceMax", "rating", "reviewCount", "soldCount", "shippedFrom", "description", "weightGrams", "demoKeyword", "demoPosition", "createdAt", "updatedAt")
VALUES
  ('demo_prd_m01', 'demo-mouse-001', 'demo-shop-001', 'Logitech MX Master 3S Wireless Mouse', 'Logitech', 'Mouse Wireless', 'https://shopee.co.id/demo-shop-001/demo-mouse-001', 'https://shopee.co.id/demo-shop-001/demo-mouse-001', NULL, 1200000, 1500000, 4.9, 5400, 3200, 'DKI Jakarta', 'Mouse wireless premium untuk produktivitas, sensor Darkfield, scroll elektromagnetik, multi-device.', 141, 'mouse', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_m02', 'demo-mouse-002', 'demo-shop-002', 'Razer DeathAdder V3 Ergonomic Mouse', 'Razer', 'Mouse Gaming', 'https://shopee.co.id/demo-shop-002/demo-mouse-002', 'https://shopee.co.id/demo-shop-002/demo-mouse-002', NULL, 950000, 1100000, 4.7, 2300, 1800, 'DKI Jakarta', 'Mouse gaming ergonomis, sensor Focus Pro 30K, switch optik generasi ke-3, bobot ringan.', 59, 'mouse', 2, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_m03', 'demo-mouse-003', 'demo-shop-005', 'Logitech G304 Lightspeed Gaming Mouse', 'Logitech', 'Mouse Gaming', 'https://shopee.co.id/demo-shop-005/demo-mouse-003', 'https://shopee.co.id/demo-shop-005/demo-mouse-003', NULL, 450000, 550000, 4.8, 8900, 12500, 'DKI Jakarta', 'Mouse gaming wireless dengan sensor HERO 12K, baterai 250 jam, bobot 99g.', 99, 'mouse', 3, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z');

-- Demo products for "laptop" (3 laptops)
INSERT OR IGNORE INTO sh_demoProducts
  ("id", "shopeeItemId", "shopeeShopId", "title", "brand", "category", "originalUrl", "canonicalUrl", "imageUrl", "priceMin", "priceMax", "rating", "reviewCount", "soldCount", "shippedFrom", "description", "weightGrams", "demoKeyword", "demoPosition", "createdAt", "updatedAt")
VALUES
  ('demo_prd_l01', 'demo-laptop-001', 'demo-shop-001', 'ASUS ROG Strix G16 Gaming Laptop', 'ASUS', 'Laptop Gaming', 'https://shopee.co.id/demo-shop-001/demo-laptop-001', 'https://shopee.co.id/demo-shop-001/demo-laptop-001', NULL, 22500000, 25000000, 4.8, 1200, 850, 'DKI Jakarta', 'Laptop gaming 16 inch, RTX 4060, Core i9-13980HX, RAM 32GB DDR5, SSD 1TB NVMe.', 2500, 'laptop', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_l02', 'demo-laptop-002', 'demo-shop-003', 'MacBook Pro 14 M3 Pro', 'Apple', 'Laptop Profesional', 'https://shopee.co.id/demo-shop-003/demo-laptop-002', 'https://shopee.co.id/demo-shop-003/demo-laptop-002', NULL, 32000000, 35000000, 4.95, 2800, 450, 'DKI Jakarta', 'MacBook Pro 14 inch chip M3 Pro, CPU 12-core, GPU 18-core, RAM 18GB, SSD 512GB.', 1600, 'laptop', 2, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_l03', 'demo-laptop-003', 'demo-shop-005', 'Lenovo IdeaPad Slim 5 14ABR8', 'Lenovo', 'Laptop Harian', 'https://shopee.co.id/demo-shop-005/demo-laptop-003', 'https://shopee.co.id/demo-shop-005/demo-laptop-003', NULL, 9500000, 11000000, 4.6, 3400, 5200, 'DKI Jakarta', 'Laptop harian 14 inch, AMD Ryzen 5 7530U, RAM 16GB DDR4, SSD 512GB, layar IPS WUXGA.', 1500, 'laptop', 3, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z');

-- Demo products for "tv" (2 TVs)
INSERT OR IGNORE INTO sh_demoProducts
  ("id", "shopeeItemId", "shopeeShopId", "title", "brand", "category", "originalUrl", "canonicalUrl", "imageUrl", "priceMin", "priceMax", "rating", "reviewCount", "soldCount", "shippedFrom", "description", "weightGrams", "demoKeyword", "demoPosition", "createdAt", "updatedAt")
VALUES
  ('demo_prd_t01', 'demo-tv-001', 'demo-shop-001', 'Samsung 55 inch Crystal UHD 4K TV', 'Samsung', 'TV LED', 'https://shopee.co.id/demo-shop-001/demo-tv-001', 'https://shopee.co.id/demo-shop-001/demo-tv-001', NULL, 7500000, 8500000, 4.7, 2100, 1800, 'DKI Jakarta', 'Smart TV 55 inch Crystal UHD 4K, HDR10+, Tizen OS, 3 HDMI, 2 USB.', 18000, 'tv', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_t02', 'demo-tv-002', 'demo-shop-003', 'LG OLED55C3 55 inch 4K Smart TV', 'LG', 'TV OLED', 'https://shopee.co.id/demo-shop-003/demo-tv-002', 'https://shopee.co.id/demo-shop-003/demo-tv-002', NULL, 16500000, 18000000, 4.9, 1500, 620, 'DKI Jakarta', 'Smart TV OLED 55 inch evo, Dolby Vision IQ, Dolby Atmos, webOS 23, 120Hz.', 20000, 'tv', 2, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z');

-- Demo products for "headphone" (3 headphones)
INSERT OR IGNORE INTO sh_demoProducts
  ("id", "shopeeItemId", "shopeeShopId", "title", "brand", "category", "originalUrl", "canonicalUrl", "imageUrl", "priceMin", "priceMax", "rating", "reviewCount", "soldCount", "shippedFrom", "description", "weightGrams", "demoKeyword", "demoPosition", "createdAt", "updatedAt")
VALUES
  ('demo_prd_h01', 'demo-headphone-001', 'demo-shop-001', 'Sony WH-1000XM5 Wireless Noise Cancelling', 'Sony', 'Headphone', 'https://shopee.co.id/demo-shop-001/demo-headphone-001', 'https://shopee.co.id/demo-shop-001/demo-headphone-001', NULL, 4200000, 4800000, 4.9, 8500, 12000, 'DKI Jakarta', 'Headphone wireless premium dengan industry-leading noise cancellation, 30 jam baterai, multipoint.', 250, 'headphone', 1, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_h02', 'demo-headphone-002', 'demo-shop-002', 'JBL Tune 760NC Wireless', 'JBL', 'Headphone', 'https://shopee.co.id/demo-shop-002/demo-headphone-002', 'https://shopee.co.id/demo-shop-002/demo-headphone-002', NULL, 850000, 1100000, 4.5, 5400, 9800, 'DKI Jakarta', 'Headphone wireless over-ear dengan active noise cancellation, 50 jam baterai, JBL Pure Bass.', 220, 'headphone', 2, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z'),
  ('demo_prd_h03', 'demo-headphone-003', 'demo-shop-005', 'Audio-Technica ATH-M50x Studio Monitor', 'Audio-Technica', 'Headphone Studio', 'https://shopee.co.id/demo-shop-005/demo-headphone-003', 'https://shopee.co.id/demo-shop-005/demo-headphone-003', NULL, 1900000, 2200000, 4.8, 2300, 1500, 'DKI Jakarta', 'Headphone studio professional, driver 45mm, respon frekuensi 15-28000Hz, cable 3m coiled.', 285, 'headphone', 3, '2026-06-21T13:30:00Z', '2026-06-21T13:30:00Z');
