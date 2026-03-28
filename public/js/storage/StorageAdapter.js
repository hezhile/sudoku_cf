/**
 * 存储适配器基类
 * 统一本地存储、游戏状态、云同步等模块的基础接口
 * @module storage/StorageAdapter
 */

export class StorageAdapter {
  /**
   * @param {string} name - 适配器名称
   */
  constructor(name) {
    this.name = name;
  }

  /**
   * 保存数据
   * @param {string} key - 业务键
   * @param {*} data - 业务数据
   * @returns {Promise<*>}
   */
  async save(key, data) {
    throw new Error(`${this.name}: save('${key}') is not implemented`);
  }

  /**
   * 加载数据
   * @param {string} key - 业务键
   * @returns {Promise<*>}
   */
  async load(key) {
    throw new Error(`${this.name}: load('${key}') is not implemented`);
  }

  /**
   * 清理数据
   * @param {string} key - 业务键
   * @returns {Promise<*>}
   */
  async clear(key) {
    throw new Error(`${this.name}: clear('${key}') is not implemented`);
  }
}