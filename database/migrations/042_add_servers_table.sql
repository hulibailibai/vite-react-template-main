-- 添加服务器管理表
-- 用于管理共享服务器信息

CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, -- 服务器名称
    url TEXT NOT NULL, -- 服务器网址
    description TEXT, -- 服务器描述
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')), -- 服务器状态
    server_type TEXT DEFAULT 'shared' CHECK (server_type IN ('shared', 'dedicated', 'cloud')), -- 服务器类型
    location TEXT, -- 服务器位置
    max_users INTEGER DEFAULT 0, -- 最大用户数（0表示无限制）
    current_users INTEGER DEFAULT 0, -- 当前用户数
    cpu_cores INTEGER, -- CPU核心数
    memory_gb INTEGER, -- 内存大小(GB)
    storage_gb INTEGER, -- 存储大小(GB)
    bandwidth_mbps INTEGER, -- 带宽(Mbps)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER, -- 创建者ID
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_servers_name ON servers(name);
CREATE INDEX IF NOT EXISTS idx_servers_status ON servers(status);
CREATE INDEX IF NOT EXISTS idx_servers_type ON servers(server_type);
CREATE INDEX IF NOT EXISTS idx_servers_created_by ON servers(created_by);
CREATE INDEX IF NOT EXISTS idx_servers_created_at ON servers(created_at);

-- 插入示例数据
INSERT OR IGNORE INTO servers (name, url, description, status, server_type, location, max_users, cpu_cores, memory_gb, storage_gb, bandwidth_mbps) VALUES
('共享服务器-01', 'https://server01.example.com', '主要共享服务器，提供基础计算服务', 'active', 'shared', '北京', 100, 8, 16, 500, 1000),
('共享服务器-02', 'https://server02.example.com', '备用共享服务器，负载均衡使用', 'active', 'shared', '上海', 100, 8, 16, 500, 1000),
('共享服务器-03', 'https://server03.example.com', '测试环境服务器', 'maintenance', 'shared', '深圳', 50, 4, 8, 250, 500);