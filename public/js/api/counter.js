/**
 * 全局计数 API 模块
 * 与 Cloudflare Pages Functions 通信
 */

const API_BASE = '/api/counter';

/**
 * 获取当前游戏计数
 */
export async function getGameCount() {
    try {
        const response = await fetch(`${API_BASE}/get`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.count;
    } catch (error) {
        console.warn('获取计数失败:', error);
        return null;
    }
}

/**
 * 增加游戏计数（非阻塞）
 */
export async function incrementGameCount() {
    try {
        const response = await fetch(`${API_BASE}/increment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) return false;
        const data = await response.json();
        updateCounterDisplay(data.count);
        return true;
    } catch (error) {
        console.warn('增加计数失败:', error);
        return false;
    }
}

/**
 * 初始化计数器
 */
export async function initCounter() {
    const count = await getGameCount();
    if (count !== null) {
        updateCounterDisplay(count);
    }
}

/**
 * 更新计数显示
 */
function updateCounterDisplay(count) {
    const counterEl = document.getElementById('game-counter');
    if (counterEl) {
        counterEl.textContent = formatNumber(count);
    }
}

/**
 * 格式化大数字
 */
function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}
