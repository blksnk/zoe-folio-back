'use strict';

/**
 *  project controller
 */

const collectionType = 'project'

const schema = require(`../content-types/${collectionType}/schema.json`);
const {
  createPopulatedController,
  getPopulateFromSchema
} = require("../../../helpers/populate");
const endpoint = `api::${collectionType}.${collectionType}`

const populate = {
  "media.project-media": true, "sizing.size": true, Medias: {
    populate: {
      id: true, media: true, pending: true, size: {
        populate: {
          x: true, y: true, width: true, height: true,
        }
      }
    }
  }
}

const populateThumbnail = {
  thumbnail: true,
}

const setThumbnail = (strapi) => async (ctx) => {
  const files = Object.values(ctx.request.files ?? {});
  const file = files[0]
  if(!file) throw new Error('Missing thumbnail file')
  const project = await strapi.entityService.findOne(endpoint, ctx.params.id, {
    populate: populateThumbnail
  })
  console.log(ctx.params.id, project, files);
  const updated = await strapi.plugins.upload.services.upload.uploadToEntity({
    id: project.thumbnail.id,
    model: "project",
    field: "thumbnail",
  }, file)
  console.log(updated);
  ctx.body = updated;
}

const addMedia = (strapi) => async (ctx) => {
  console.log('add media', ctx.request.files)
  const files = Object.values(ctx.request.files ?? {})
  // fetch current media projects
  const project = await strapi.entityService.findOne(endpoint, ctx.params.id, {
    populate
  }, files)

  // check if pending medias are leftover
  let pendingMediaIds = project.Medias.filter(({pending}) => pending).map(({id}) => id);

  // update project to create needed pending medias
  const toCreateCount = files.length - pendingMediaIds.length;

  console.log(files.length + " files to upload, " + pendingMediaIds.length + " pending medias, creating " + toCreateCount)
  if (toCreateCount > 0) {
    // prepare new medias
    const pendingMedias = new Array(toCreateCount).fill({pending: true})
    const Medias = [...project.Medias, ...pendingMedias,]

    // update project with new media lists
    const updated = await strapi.entityService.update(endpoint, ctx.params.id, {
      data: {
        Medias
      }, populate
    })

    pendingMediaIds = updated.Medias.filter(({pending}) => pending).map(({id}) => id);
  }

  // for each pending media & file, update file to target media

  for (let i = 0; i < pendingMediaIds.length; i++) {
    const mediaId = pendingMediaIds[i];
    const file = files[i];
    if (!file || mediaId === undefined) {
      pendingMediaIds.splice(i);
      break;
    }
    console.log(mediaId, file)
    // upload new file
    await strapi.plugins.upload.services.upload.uploadToEntity({
      id: mediaId, model: "media.project-media", field: 'media',
    }, file)
  }

  // cleanup additional pending components if needed
  const updatedMedias = (await strapi.entityService.findOne(endpoint, ctx.params.id, {
    populate
  })).Medias

  console.log(updatedMedias)
  const cleanupPayload = updatedMedias.filter(({media}) => !!media).map(media => ({
    ...media, pending: null, size: media.pending ? {
      width: 5, height: 5,
    } : media.size ?? null,
  }))

  console.log('cleaning with payload:\n', cleanupPayload)

  await strapi.entityService.update(endpoint, ctx.params.id, {
    data: {
      Medias: cleanupPayload,
    }, populate,
  })

  ctx.body = cleanupPayload;
}

const deleteMedia = (strapi) => async (ctx) => {
  console.log(ctx.params)
  const {id, mediaId} = ctx.params;
  const medias = (await strapi.entityService.findOne(endpoint, id, {
    populate
  })).Medias

  const newMedias = medias.filter(({id}) => parseInt(id) !== parseInt(mediaId));

  console.log(newMedias.map(({id}) => id))

  const updated = await strapi.entityService.update(endpoint, id, {
    data: {
      Medias: newMedias,
    }, populate
  })

  console.log(updated.Medias.map(({id}) => id))

  ctx.body = updated.Medias
}

const updateMedia = (strapi) => async (ctx) => {
  const {id, mediaId} = ctx.params;
  const file = Object.values(ctx.request.files ?? {})[0];
  if (!file) {
    ctx.status = 401;
    return;
  }

  // get current media file id
  const media = strapi.entityService.findOne("media.project-media", mediaId, {
    populate: {
      media: true, id: true,
    }
  })

  console.log(mediaId, media.media.id)

  // delete old file from storage
  strapi.log('Deleting old file with id ' + media.media.id)
  await strapi.plugins.upload.services.file.deleteByIds([media.media.id])
  // upload new file and update project media entity

  strapi.log('Uploading new file ' + file.name + ' to project media with id ' + mediaId)
  await strapi.plugins.upload.services.upload.uploadToEntity({
    id: mediaId, model: "media.project-media", field: 'media',
  }, file)

  // get updated project media
  const updatedProjectMedia = (await strapi.entityService.findOne(endpoint, id, {
    populate,
  })).Medias.find(m => m.id === mediaId)

  strapi.log('Updated project media with id ' + mediaId + ' with new file with id ' + media.media.id)

  ctx.body = updatedProjectMedia
}

const setMediaSizes = (strapi) => async (ctx) => {
  const {id} = ctx.params;
  const {sizes} = ctx.request.body;

  console.log(sizes, ctx.request.body);

  const medias = (await strapi.entityService.findOne(endpoint, id, {
    populate
  })).Medias

  const concatSize = (size, mediaId) => ({
    ...size, ...(sizes.find(m => m.id === mediaId)?.size ?? {})
  })

  const newMedias = medias.map(media => ({
    ...media, size: concatSize(media.size, media.id)
  }))

  const updated = await strapi.entityService.update(endpoint, id, {
    data: {
      Medias: newMedias,
    }, populate
  })

  ctx.body = updated.Medias
}

module.exports = createPopulatedController(endpoint, schema, {
  addMedia,
  deleteMedia,
  setMediaSizes,
  updateMedia,
  setThumbnail
});
