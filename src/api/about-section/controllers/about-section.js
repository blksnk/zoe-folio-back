'use strict';

/**
 *  about-section controller
 */

const collectionType = 'about-section'

const schema = require(`../content-types/${collectionType}/schema.json`);
const { createPopulatedController } = require("../../../helpers/populate");

module.exports = createPopulatedController(`api::${collectionType}.${collectionType}`, schema);
