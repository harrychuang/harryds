'use strict';

/**
 * page-like controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::page-like.page-like', ({ strapi }) => ({
  /**
   * 增加 like 計數
   * POST /api/page-likes/like
   * Body: { path: string }
   */
  async like(ctx) {
    const { path } = ctx.request.body;

    if (!path || typeof path !== 'string') {
      return ctx.badRequest('path is required');
    }

    // 正規化路徑
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    try {
      // 查找現有記錄
      const existing = await strapi.db.query('api::page-like.page-like').findOne({
        where: { path: normalizedPath },
      });

      let result;

      if (existing) {
        // 更新計數
        result = await strapi.db.query('api::page-like.page-like').update({
          where: { id: existing.id },
          data: { count: existing.count + 1 },
        });
      } else {
        // 建立新記錄
        result = await strapi.db.query('api::page-like.page-like').create({
          data: {
            path: normalizedPath,
            count: 1,
          },
        });
      }

      return ctx.send({
        data: {
          path: result.path,
          count: result.count,
        },
      });
    } catch (error) {
      strapi.log.error('page-like like error:', error);
      return ctx.internalServerError('Failed to like');
    }
  },

  /**
   * 減少 like 計數
   * POST /api/page-likes/unlike
   * Body: { path: string }
   */
  async unlike(ctx) {
    const { path } = ctx.request.body;

    if (!path || typeof path !== 'string') {
      return ctx.badRequest('path is required');
    }

    // 正規化路徑
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    try {
      // 查找現有記錄
      const existing = await strapi.db.query('api::page-like.page-like').findOne({
        where: { path: normalizedPath },
      });

      if (!existing) {
        return ctx.send({
          data: {
            path: normalizedPath,
            count: 0,
          },
        });
      }

      // 減少計數（最低為 0）
      const newCount = Math.max(0, existing.count - 1);

      const result = await strapi.db.query('api::page-like.page-like').update({
        where: { id: existing.id },
        data: { count: newCount },
      });

      return ctx.send({
        data: {
          path: result.path,
          count: result.count,
        },
      });
    } catch (error) {
      strapi.log.error('page-like unlike error:', error);
      return ctx.internalServerError('Failed to unlike');
    }
  },

  /**
   * 根據路徑獲取 like 計數
   * GET /api/page-likes/by-path?path=/xxx
   */
  async getByPath(ctx) {
    const { path } = ctx.query;

    if (!path || typeof path !== 'string') {
      return ctx.badRequest('path query parameter is required');
    }

    // 正規化路徑
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    try {
      const existing = await strapi.db.query('api::page-like.page-like').findOne({
        where: { path: normalizedPath },
      });

      return ctx.send({
        data: {
          path: normalizedPath,
          count: existing?.count || 0,
        },
      });
    } catch (error) {
      strapi.log.error('page-like getByPath error:', error);
      return ctx.internalServerError('Failed to get like count');
    }
  },

  /**
   * 批量獲取多個路徑的 like 計數
   * POST /api/page-likes/batch
   * Body: { paths: string[] }
   */
  async getBatch(ctx) {
    const { paths } = ctx.request.body;

    if (!paths || !Array.isArray(paths)) {
      return ctx.badRequest('paths array is required');
    }

    try {
      // 正規化所有路徑
      const normalizedPaths = paths.map(p => 
        typeof p === 'string' && p.startsWith('/') ? p : `/${p}`
      );

      const records = await strapi.db.query('api::page-like.page-like').findMany({
        where: {
          path: { $in: normalizedPaths },
        },
      });

      // 建立路徑到計數的映射
      const countMap = {};
      records.forEach(record => {
        countMap[record.path] = record.count;
      });

      // 返回所有請求路徑的計數（不存在的為 0）
      const result = normalizedPaths.map(path => ({
        path,
        count: countMap[path] || 0,
      }));

      return ctx.send({
        data: result,
      });
    } catch (error) {
      strapi.log.error('page-like getBatch error:', error);
      return ctx.internalServerError('Failed to get like counts');
    }
  },
}));

