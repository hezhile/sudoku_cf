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
        const data = await response.json();
        // 即使响应是 error，也返回 count (可能是 0)
        return data.count ?? 0;
    } catch (error) {
        console.warn('获取计数失败:', error);
        return 0;
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
        const data = await response.json();
        // 检查 count 是否存在，并更新显示
        if (typeof data.count === 'number') {
            updateCounterDisplay(data.count);
        }
        return response.ok;
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
    // count 现在默认为 0，不再是 null
    updateCounterDisplay(count);
}

/**
 * 更新计数显示
 */
function updateCounterDisplay(count) {
    const counterEl = document.getElementById('game-counter');
    if (counterEl) {
        // 确保传入的是有效数字
        const num = typeof count === 'number' ? count : 0;
        counterEl.textContent = formatNumber(num);
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
