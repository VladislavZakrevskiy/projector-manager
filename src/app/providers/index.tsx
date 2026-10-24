import { ThemeProvider } from '@gravity-ui/uikit';
import { RouterProvider } from '@tanstack/react-router';

import { router } from '../routes';

export function AppProviders() {
  return (
    <ThemeProvider theme="dark">
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
