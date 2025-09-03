-- 添加countries表用于存储国家/地区信息
CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL, -- 国家代码，如 'china', 'usa', 'japan'
    name TEXT NOT NULL, -- 国家名称，如 '中国', '美国', '日本'
    name_en TEXT, -- 英文名称，如 'China', 'United States', 'Japan'
    sort_order INTEGER DEFAULT 0, -- 排序顺序
    is_active BOOLEAN DEFAULT TRUE, -- 是否启用
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_countries_active ON countries(is_active);
CREATE INDEX IF NOT EXISTS idx_countries_sort_order ON countries(sort_order);

-- 插入初始国家数据
INSERT OR IGNORE INTO countries (code, name, name_en, sort_order, is_active) VALUES
('china', '中国', 'China', 1, TRUE),
('usa', '美国', 'United States', 2, TRUE),
('japan', '日本', 'Japan', 3, TRUE),
('korea', '韩国', 'South Korea', 4, TRUE),
('uk', '英国', 'United Kingdom', 5, TRUE),
('germany', '德国', 'Germany', 6, TRUE),
('france', '法国', 'France', 7, TRUE),
('canada', '加拿大', 'Canada', 8, TRUE),
('australia', '澳大利亚', 'Australia', 9, TRUE),
('singapore', '新加坡', 'Singapore', 10, TRUE),
('custom', '其他（自定义）', 'Other (Custom)', 999, TRUE);