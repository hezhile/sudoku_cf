// GET /api/counter/get - 获取当前游戏计数
export async function onRequestGet(context) {
    const { env } = context;
    const currentCount = await env.SUDOKU_COUNTER.get('sudoku:game_count');

    return new Response(JSON.stringify({
        count: parseInt(currentCount) || 0
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}
