import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import { EditorPage } from '~/pages/editor';
import { OutputPage } from '~/pages/output';

const rootRoute = createRootRoute({ component: Outlet });

const editorRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: EditorPage,
});

const outputRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/output',
  component: OutputPage,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([editorRoute, outputRoute]),
});
