import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 使用 jsdom 环境来支持 DOM API
    environment: 'jsdom',
    
    // 测试文件全局变量
    globals: true,
    
    // 额外的全局对象，以防需要
    setupFiles: [],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'public/js/__tests__/',
        '*.config.js'
      ],
      lines: 60,
      functions: 60,
      branches: 60,
      statements: 60
    },
    
    // 包含的测试文件模式
    include: ['public/js/__tests__/**/*.test.js'],
    
    // 排除的模式
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache'
    ]
  },
  
  resolve: {
    alias: {
      '@': '/public/js'
    }
  }
});
