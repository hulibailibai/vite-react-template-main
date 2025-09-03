-- 添加用户偏好设置表
-- 用于存储用户的个人偏好设置，包括主题选择

CREATE TABLE user_preferences (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    preference_key VARCHAR(50) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id, preference_key),
    INDEX idx_user_id (user_id),
    INDEX idx_preference_key (preference_key)
);

-- 插入一些示例偏好设置
-- 主题设置：'theme' -> 'dark' 或 'light'
-- 语言设置：'language' -> 'zh' 或 'en'
-- 通知设置：'notifications' -> 'enabled' 或 'disabled'

-- 为现有用户设置默认主题为深色
INSERT INTO user_preferences (user_id, preference_key, preference_value)
SELECT id, 'theme', 'dark' FROM users WHERE id NOT IN (
    SELECT user_id FROM user_preferences WHERE preference_key = 'theme'
);