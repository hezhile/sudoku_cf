/**
 * 认证处理模块 - Supabase Magic Link 登录
 * @module auth/auth-handler
 */

import { SUPABASE_CONFIG } from '../config/constants.js';
import { emit } from '../utils/event-bus.js';
import { showSuccess, showError, showWarning } from '../ui/toast.js';
import { EVENTS } from '../config/events.js';

// 获取全局i18n实例
const getI18n = () => window.i18n;

/**
 * Supabase 客户端实例
 * @type {Object|null}
 */
let supabase = null;

/**
 * 当前用户会话
 * @type {Object|null}
 */
let currentSession = null;

/**
 * DOM 元素
 */
let emailInput = null;
let loginBtn = null;
let logoutBtn = null;
let userInfo = null;
let syncBtn = null;
let emailValidationMessage = null;

/**
 * 初始化认证模块
 * @returns {Promise<void>}
 * @example
 * await initAuth();
 */
export async function initAuth() {
  try {
    // 动态导入 Supabase 客户端
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.87.0');

    // 创建 Supabase 客户端
    supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

    // 获取 DOM 元素
    emailInput = document.getElementById('emailInput');
    loginBtn = document.getElementById('loginBtn');
    logoutBtn = document.getElementById('logoutBtn');
    userInfo = document.getElementById('userInfo');
    syncBtn = document.getElementById('syncBtn');
    emailValidationMessage = document.getElementById('emailValidationMessage');

    // 绑定事件
    if (loginBtn) {
      loginBtn.addEventListener('click', handleLogin);
    }
    if (emailInput) {
      emailInput.addEventListener('input', clearEmailValidation);
    }
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }
    if (syncBtn) {
      syncBtn.addEventListener('click', handleManualSync);
    }

    // 显式处理 PKCE code 交换（magic link 回调时 URL 带 ?code=xxx）
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      try {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('PKCE code 交换失败:', exchangeError);
          showError(getI18n().t('errors.authFailed'));
        }
        // 清除 URL 中的 auth 相关参数
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('code');
        cleanUrl.searchParams.delete('type');
        cleanUrl.searchParams.delete('error');
        cleanUrl.searchParams.delete('error_code');
        cleanUrl.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.hash);
      } catch (exchangeErr) {
        console.error('PKCE code 交换异常:', exchangeErr);
      }
    }

    // 监听登录/登出事件（必须在 getSession 之前注册）
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        currentSession = session;
        setLoggedInUI(session.user);
        emit(EVENTS.AUTH_LOGIN, { user: session.user });
      } else {
        currentSession = null;
        setLoggedOutUI();
        emit(EVENTS.AUTH_LOGOUT);
      }
    });

    // 读取当前 session
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentSession = session;
      setLoggedInUI(session.user);
      emit(EVENTS.AUTH_LOGIN, { user: session.user });
    } else {
      setLoggedOutUI();
    }
  } catch (error) {
    console.error('认证模块初始化失败:', error);
    showError(getI18n().t('errors.authFailed'));
    emit(EVENTS.AUTH_ERROR, { error });
  }
}

/**
 * 处理登录（发送 Magic Link）
 */
async function handleLogin() {
  if (!emailInput) return;

  clearEmailValidation();
  const email = emailInput.value.trim();
  if (!email) {
    reportEmailValidation('errors.emptyEmail');
    return;
  }

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    reportEmailValidation('errors.invalidEmail');
    return;
  }

  try {
    loginBtn.disabled = true;
    loginBtn.textContent = getI18n().t('buttons.sending');

    const redirectTo = window.location.origin + window.location.pathname;
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    });

    if (error) {
      throw error;
    }

    showSuccess(getI18n().t('buttons.sent'));
    emailInput.value = '';
    emit(EVENTS.AUTH_MAGIC_LINK_SENT, { email });
  } catch (error) {
    console.error('发送登录邮件失败:', error);
    showError(getI18n().t('errors.sendFailed') + (error.message || getI18n().t('errors.unknown')));
    emit(EVENTS.AUTH_ERROR, { error, operation: 'login' });
  } finally {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.textContent = getI18n().t('login');
    }
  }
}

/**
 * 处理登出
 */
async function handleLogout() {
  try {
    if (logoutBtn) {
      logoutBtn.disabled = true;
    }

    await supabase.auth.signOut();
    showSuccess(getI18n().t('status.loggedOut'));
  } catch (error) {
    console.error('登出失败:', error);
    showError(getI18n().t('errors.logoutFailed'));
    emit(EVENTS.AUTH_ERROR, { error, operation: 'logout' });
  } finally {
    if (logoutBtn) {
      logoutBtn.disabled = false;
    }
  }
}

/**
 * 处理手动同步
 */
async function handleManualSync() {
  if (!currentSession) {
    showWarning(getI18n().t('status.notLoggedIn'));
    return;
  }

  try {
    emit(EVENTS.SYNC_MANUAL_TRIGGER, { userId: currentSession.user.id });
  } catch (error) {
    console.error('手动同步失败:', error);
    showError(getI18n().t('errors.syncFailed'));
  }
}

/**
 * 设置登录后的 UI 状态
 * @param {Object} user - 用户对象
 */
function setLoggedInUI(user) {
  if (userInfo) {
    userInfo.textContent = user.email || user.id;
  }
  if (loginBtn) {
    loginBtn.style.display = 'none';
  }
  if (emailInput) {
    emailInput.style.display = 'none';
  }
  if (logoutBtn) {
    logoutBtn.style.display = 'inline-block';
  }
  if (syncBtn) {
    syncBtn.style.display = 'inline-block';
  }
}

/**
 * 设置登出后的 UI 状态
 */
function setLoggedOutUI() {
  if (userInfo) {
    userInfo.textContent = '';
  }
  if (loginBtn) {
    loginBtn.style.display = 'inline-block';
  }
  if (emailInput) {
    emailInput.style.display = 'inline-block';
  }
  if (logoutBtn) {
    logoutBtn.style.display = 'none';
  }
  if (syncBtn) {
    syncBtn.style.display = 'none';
  }
}

function clearEmailValidation() {
  if (!emailInput) return;

  emailInput.setCustomValidity('');
  if (emailValidationMessage) {
    emailValidationMessage.textContent = '';
  }
}

function reportEmailValidation(key) {
  if (!emailInput) return;

  const message = getI18n().t(key);
  emailInput.setCustomValidity(message);
  if (emailValidationMessage) {
    emailValidationMessage.textContent = message;
  }
  emailInput.reportValidity();
}

/**
 * 获取当前会话
 * @returns {Promise<Object|null>} 当前会话对象
 * @example
 * const session = await getCurrentSession();
 * if (session) {
 *   console.log('User:', session.user.email);
 * }
 */
export async function getCurrentSession() {
  if (!supabase) {
    console.warn('Supabase 未初始化');
    return null;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('获取会话失败:', error);
    return null;
  }
}

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
  return !!currentSession;
}

/**
 * 获取当前用户信息
 * @returns {Object|null} 用户对象
 */
export function getCurrentUser() {
  return currentSession?.user || null;
}

/**
 * 获取 Supabase 客户端实例（供其他模块使用）
 * @returns {Object|null} Supabase 客户端
 */
export function getSupabaseClient() {
  return supabase;
}
