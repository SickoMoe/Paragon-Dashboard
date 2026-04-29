
import { RouteObject } from 'react-router-dom';
import GenericRouteConfig from '../interfaces/iGenericRouteConfig';

export function routeBuilder(configs: GenericRouteConfig[]): RouteObject[] {
  return configs.map((config) => {
    const { path, element, loader, action, errorElement, children, index,id } =
      config;

    const route: RouteObject = {
      id,
      path,
      element,
      loader,
      action,
      errorElement,
      index,
    };

    if (children && children.length > 0) {
      route.children = routeBuilder(children);
    }

    return route;
  });
}