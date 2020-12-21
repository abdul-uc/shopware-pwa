// const componentsMap = {}
const componentsMap = {
  
}

import cmsMap from "sw-cms/cmsMap.json"

function loadComponent(path) {
  if (componentsMap[path]) return componentsMap[path]
  return () =>
    import(`sw-cms/CmsNoComponent`)
}

function resolveComponent(blockType, contentType) {
  return loadComponent(`sw-cms/${blockType}/${cmsMap[blockType][contentType]}`)
}

export function getCmsSectionComponent(content) {
  return resolveComponent('sections', content.type)
}

export function getCmsBlockComponent(content) {
  return resolveComponent('blocks', content.type)
}

export function getCmsElementComponent(content) {
  return resolveComponent('elements', content.type)
}

