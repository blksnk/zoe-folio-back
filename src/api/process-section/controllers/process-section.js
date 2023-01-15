'use strict';

/**
 *  process-section controller
 */

const collectionType = 'process-section'

const schema = require(`../content-types/${collectionType}/schema.json`);
const { createPopulatedController } = require("../../../helpers/populate");

module.exports = createPopulatedController(`api::${collectionType}.${collectionType}`, schema);
