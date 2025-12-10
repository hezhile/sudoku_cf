class I18n {
  constructor() {
    // 安全地获取语言设置，支持隐私模式
    try {
      // Try to get saved language, default to English instead of Chinese
      this.currentLang = localStorage.getItem('language') || 'en-US';
    } catch (error) {
      console.warn('localStorage is not available, using default language:', error);
      this.currentLang = 'en-US';
    }
    this.translations = {};
    this.fallbackLang = 'en-US';
    this._loadingPromises = new Map(); // 缓存正在进行的加载Promise
  }

  async loadTranslations(lang) {
    // 如果已经加载过了，直接返回
    if (this.translations[lang]) {
      return;
    }

    // 如果正在加载中，返回现有的Promise
    if (this._loadingPromises.has(lang)) {
      return this._loadingPromises.get(lang);
    }

    // 创建加载Promise并缓存
    const loadingPromise = (async () => {
      try {
        console.log(`Loading translations for: ${lang}`);
        const response = await fetch(`/translations/${lang}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load translations for ${lang}`);
        }
        this.translations[lang] = await response.json();
        console.log(`Successfully loaded translations for ${lang}`, Object.keys(this.translations[lang]));

        // 触发翻译加载完成事件
        window.dispatchEvent(new CustomEvent('translationsLoaded', { detail: { language: lang } }));
      } catch (error) {
        console.error('Failed to load translations:', error);
        // 如果加载失败，尝试加载回退语言
        if (lang !== this.fallbackLang) {
          await this.loadTranslations(this.fallbackLang);
        }
        throw error; // 重新抛出错误以便调用方处理
      } finally {
        // 无论成功或失败，都从缓存中移除Promise
        this._loadingPromises.delete(lang);
      }
    })();

    // 缓存Promise
    this._loadingPromises.set(lang, loadingPromise);

    // 返回Promise
    return loadingPromise;
  }

  t(key, params = {}) {
    let translation;

    // 处理嵌套key（如 errors.generationFailed）
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = this.translations[this.currentLang];

      for (const k of keys) {
        value = value?.[k];
        if (!value) break;
      }

      if (!value && this.currentLang !== this.fallbackLang) {
        value = this.translations[this.fallbackLang];
        for (const k of keys) {
          value = value?.[k];
          if (!value) break;
        }
      }

      translation = value;
    } else {
      // 获取当前语言的翻译
      translation = this.translations[this.currentLang]?.[key];

      // 如果没有找到翻译，尝试回退语言
      if (!translation && this.currentLang !== this.fallbackLang) {
        translation = this.translations[this.fallbackLang]?.[key];
      }
    }

    // 如果仍然没有找到，返回key本身
    if (!translation) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

    // 替换参数
    if (typeof translation === 'string') {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }

    return translation;
  }

  async setLanguage(lang) {
    if (lang === this.currentLang) {
      return;
    }

    console.log('Setting language to:', lang);
    await this.loadTranslations(lang);
    this.currentLang = lang;

    // 安全地保存语言设置，支持隐私模式
    try {
      localStorage.setItem('language', lang);
    } catch (error) {
      console.warn('Cannot save language preference to localStorage:', error);
    }

    // 更新HTML的lang属性
    document.documentElement.lang = lang;

    // 触发语言变更事件
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

    console.log('Updating DOM with new translations');
    this.updateDOM();

    // 触发翻译加载完成事件
    window.dispatchEvent(new CustomEvent('translationsLoaded', { detail: { language: lang } }));
  }

  updateDOM() {
    console.log('updateDOM called, currentLang:', this.currentLang);
    console.log('Available translations:', Object.keys(this.translations));

    // 更新所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      console.log('Translating key:', key);
      const translation = this.t(key);
      if (translation) {
        element.textContent = translation;
      }
    });

    // 更新 placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation) {
        element.placeholder = translation;
      }
    });

    // 更新 title
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translation = this.t(key);
      if (translation) {
        element.title = translation;
      }
    });

    // 更新 aria-label
    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria-label');
      const translation = this.t(key);
      if (translation) {
        element.setAttribute('aria-label', translation);
      }
    });

    // 特别处理难度选择器的选项
    this.updateDifficultySelector();
  }

  updateDifficultySelector() {
    const difficultySelect = document.getElementById('difficulty');
    if (difficultySelect) {
      const options = difficultySelect.querySelectorAll('option');
      options.forEach(option => {
        const key = option.getAttribute('data-i18n');
        if (key) {
          const translation = this.t(key);
          if (translation && translation !== key) {
            option.textContent = translation;
          }
        }
      });
    }
  }

  getCurrentLanguage() {
    return this.currentLang;
  }

  getAvailableLanguages() {
    return [
      { code: 'zh-CN', name: '中文' },
      { code: 'en-US', name: 'English' },
      { code: 'ja-JP', name: '日本語' }
    ];
  }
}

// 创建全局实例
window.i18n = new I18n();

// 自动初始化并更新DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await window.i18n.loadTranslations(window.i18n.currentLang);
    window.i18n.updateDOM();
  });
} else {
  // 如果DOM已经加载完成，立即更新
  window.i18n.loadTranslations(window.i18n.currentLang).then(() => {
    window.i18n.updateDOM();
  });
}