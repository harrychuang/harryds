'use strict';

/**
 * page-like custom routes
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/page-likes/like',
      handler: 'page-like.like',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/page-likes/unlike',
      handler: 'page-like.unlike',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/page-likes/by-path',
      handler: 'page-like.getByPath',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/page-likes/batch',
      handler: 'page-like.getBatch',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

