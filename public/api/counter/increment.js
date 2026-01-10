// POST /api/counter/increment - 增加游戏计数
export async function onRequestPost(context) {
    const { env } = context;

    // 获取当前计数
    const currentCount = await env.SUDOKU_COUNTER.get('sudoku:game_count');
    const newCount = (parseInt(currentCount) || 0) + 1;

    // 保存新计数（1年过期时间）
    await env.SUDOKU_COUNTER.put('sudoku:game_count', newCount.toString(), {
        expirationTtl: 31536000
    });

    return new Response(JSON.stringify({ count: newCount }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
