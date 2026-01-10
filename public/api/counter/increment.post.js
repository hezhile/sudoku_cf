/**
 * POST /api/counter/increment
 * 增加全局游戏计数
 *
 * Cloudflare Pages Function
 *
 * 配置要求（在 Cloudflare Dashboard）:
 * 1. 创建 KV 命名空间
 * 2. 在 Pages → Settings → Functions → KV namespace bindings 中绑定:
 *    - Variable name: SUDOKU_COUNTER (必须大写)
 *    - KV namespace: 选择创建的命名空间
 *
 * KV 存储结构:
 * - Key: sudoku:game_count
 * - Value: 数字字符串 (如 "123")
 */
export async function onRequest(context) {
    const { env } = context;

    // 检查 KV 是否已绑定
    if (!env.SUDOKU_COUNTER) {
        return new Response(JSON.stringify({
            error: 'KV_NOT_BOUND',
            message: 'KV namespace not bound. Please bind SUDOKU_COUNTER in Cloudflare Dashboard.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        // 获取当前计数，如果不存在则返回 0
        const currentCount = await env.SUDOKU_COUNTER.get('sudoku:game_count');
        const newCount = (parseInt(currentCount) || 0) + 1;

        // 保存新计数（1年过期时间，每次写入会自动续期）
        await env.SUDOKU_COUNTER.put('sudoku:game_count', newCount.toString(), {
            expirationTtl: 31536000 // 365天
        });

        // 返回新计数
        return new Response(JSON.stringify({ count: newCount }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({
            error: 'KV_ERROR',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
