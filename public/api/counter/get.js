/**
 * GET /api/counter/get
 * 获取当前全局游戏计数
 *
 * Cloudflare Pages Function
 *
 * 配置要求（在 Cloudflare Dashboard）:
 * 1. 创建 KV 命名空间
 * 2. 在 Pages → Settings → Functions → KV namespace bindings 中绑定:
 *    - Variable name: SUDOKU_COUNTER (必须大写)
 *    - KV namespace: 选择创建的命名空间
 *
 * 返回格式:
 * - 成功: { "count": 123 }
 * - 首次访问（无数据）: { "count": 0 }
 * - KV 未绑定: { "error": "KV_NOT_BOUND", ... }
 */
export async function onRequestGet(context) {
    const { env } = context;

    // 检查 KV 是否已绑定
    if (!env.SUDOKU_COUNTER) {
        return new Response(JSON.stringify({
            error: 'KV_NOT_BOUND',
            message: 'KV namespace not bound. Please bind SUDOKU_COUNTER in Cloudflare Dashboard.',
            count: 0
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 从 KV 获取当前计数，如果不存在则返回 0
        const currentCount = await env.SUDOKU_COUNTER.get('sudoku:game_count');

        return new Response(JSON.stringify({
            count: parseInt(currentCount) || 0
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'KV_ERROR',
            message: error.message,
            count: 0
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
