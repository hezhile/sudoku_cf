class I18n {
  constructor() {
    this.currentLang = localStorage.getItem('language') || 'zh-CN';
    this.translations = {};
    this.fallbackLang = 'zh-CN';
  }

  async loadTranslations(lang) {
    if (this.translations[lang]) {
      return;
    }

    try {
      const response = await fetch(`/translations/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations for ${lang}`);
      }
      this.translations[lang] = await response.json();
    } catch (error) {
      console.error('Failed to load translations:', error);
      // 如果加载失败，尝试加载回退语言
      if (lang !== this.fallbackLang) {
        await this.loadTranslations(this.fallbackLang);
      }
    }
  }

  t(key, params = {}) {
    // 获取当前语言的翻译
    let translation = this.translations[this.currentLang]?.[key];

    // 如果没有找到翻译，尝试回退语言
    if (!translation && this.currentLang !== this.fallbackLang) {
      translation = this.translations[this.fallbackLang]?.[key];
    }

    // 如果仍然没有找到，返回key本身
    if (!translation) {
      console.warn(`Translation not found for key: ${key}`);
      return key;
    }

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

      translation = value || key;
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
    localStorage.setItem('language', lang);

    // 更新HTML的lang属性
    document.documentElement.lang = lang;

    // 触发语言变更事件
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));

    console.log('Updating DOM with new translations');
    this.updateDOM();
  }

  updateDOM() {
    // 更新所有带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
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