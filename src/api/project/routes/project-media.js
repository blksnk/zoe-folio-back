module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/projects/:id/media/add',
      handler: "project.addMedia",
    }, {
      method: 'DELETE',
      path: "/projects/:id/media/delete/:mediaId",
      handler: "project.deleteMedia",
    },
    {
      method: 'PATCH',
      path: '/projects/:id/media/sizes',
      handler: "project.setMediaSizes",
    }, {
      method: 'PATCH',
      path: '/project/:id/media/update/:mediaId',
      handler: "project.updateMedia"
    },
    {
      method: 'PUT',
      path: '/projects/:id/media/thumbnail',
      handler: 'project.setThumbnail'
    }
  ],
}
