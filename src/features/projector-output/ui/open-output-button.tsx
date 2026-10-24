import { Button } from '@gravity-ui/uikit';
import { useUnit } from 'effector-react';

import type { ProjectorOutputFeature } from '../model';

type OpenOutputButtonProps = {
  model: ProjectorOutputFeature;
};

export function OpenOutputButton({ model }: OpenOutputButtonProps) {
  const openOutput = useUnit(model.openRequested);

  return <Button onClick={openOutput}>Окно проектора</Button>;
}
