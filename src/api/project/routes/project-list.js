module.exports = {
  routes: [
    {
      method: 'PATCH',
      path: '/projects/reorder',
      handler: 'project.reorderProjects',
    },
    {
      method: 'PATCH',
      path: '/projects/sizes',
      handler: 'project.setProjectSizes'
    }
  ]
}
