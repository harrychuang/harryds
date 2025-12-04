'use strict';

/**
 * page-like service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::page-like.page-like');

