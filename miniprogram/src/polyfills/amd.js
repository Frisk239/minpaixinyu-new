/**
 * Enhanced AMD polyfill for WeChat Mini Program
 * 解决微信小程序环境中缺少define函数的问题
 */

// 立即执行函数，确保在模块加载前就注入define
(function() {
  'use strict';

  // 检查是否已经有define函数
  if (typeof define === 'function') {
    console.log('define function already exists, skipping polyfill');
    return;
  }

  // 创建全局define函数
  var define = function(name, deps, factory) {
    // 支持多种调用方式：
    // 1. define(name, deps, factory)
    // 2. define(deps, factory)
    // 3. define(factory)

    if (typeof name !== 'string') {
      // 如果第一个参数不是字符串，说明是第二种或第三种调用方式
      factory = deps;
      deps = name;
      name = null;
    }

    if (typeof deps === 'function') {
      // 如果第二个参数是函数，说明是第三种调用方式
      factory = deps;
      deps = [];
    }

    if (typeof factory !== 'function') {
      // 如果工厂函数不是函数类型，抛出错误
      throw new Error('define: factory must be a function');
    }

    try {
      // 立即执行工厂函数
      if (deps && deps.length > 0) {
        // 如果有依赖，先获取依赖模块
        var resolvedDeps = deps.map(function(dep) {
          if (dep === 'require') {
            return function() {};
          } else if (dep === 'exports') {
            return {};
          } else if (dep === 'module') {
            return { exports: {} };
          }
          return {};
        });
        factory.apply(null, resolvedDeps);
      } else {
        factory();
      }
    } catch (error) {
      console.error('define: error executing factory function:', error);
    }
  };

  // 设置AMD标识
  define.amd = {
    jQuery: true,
    version: '2.1.0'
  };

  // 多重注入确保define函数在所有环境中可用
  if (typeof global !== 'undefined') {
    global.define = define;
  }
  if (typeof window !== 'undefined') {
    window.define = define;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.define = define;
  }
  if (typeof self !== 'undefined') {
    self.define = define;
  }

  // 在微信小程序环境中，也要确保define在wx对象上可用
  if (typeof wx !== 'undefined') {
    wx.define = define;
  }

  console.log('Enhanced AMD polyfill loaded successfully');
})();