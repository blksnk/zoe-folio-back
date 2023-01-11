'use strict';

/**
 *  studio-section controller
 */

const collectionType = 'studio-section'

const schema = require(`../content-types/${collectionType}/schema.json`);
const { createPopulatedController } = require("../../../helpers/populate");

module.exports = createPopulatedController(`api::${collectionType}.${collectionType}`, schema);
