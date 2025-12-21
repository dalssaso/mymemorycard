import type { Route, RouteHandler } from '@/types';

export class Router {
  private routes: Route[] = [];

  private pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const pattern = path.replace(/:(\w+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });
    
    return {
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
    };
  }

  add(method: string, path: string, handler: RouteHandler, requiresAuth = false) {
    const { pattern, paramNames } = this.pathToRegex(path);
    this.routes.push({ method, pattern, paramNames, handler, requiresAuth });
  }

  get(path: string, handler: RouteHandler, requiresAuth = false) {
    this.add('GET', path, handler, requiresAuth);
  }

  post(path: string, handler: RouteHandler, requiresAuth = false) {
    this.add('POST', path, handler, requiresAuth);
  }

  put(path: string, handler: RouteHandler, requiresAuth = false) {
    this.add('PUT', path, handler, requiresAuth);
  }

  patch(path: string, handler: RouteHandler, requiresAuth = false) {
    this.add('PATCH', path, handler, requiresAuth);
  }

  delete(path: string, handler: RouteHandler, requiresAuth = false) {
    this.add('DELETE', path, handler, requiresAuth);
  }

  match(pathname: string, method: string): { route: Route; params: Record<string, string> } | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      
      const match = pathname.match(route.pattern);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return { route, params };
      }
    }
    return null;
  }
}

export const router = new Router();
