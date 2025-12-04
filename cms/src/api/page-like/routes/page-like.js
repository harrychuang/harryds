'use strict';

/**
 * page-like router (core routes)
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::page-like.page-like');

