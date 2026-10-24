import { Button, Select, Text } from '@gravity-ui/uikit';
import { useUnit } from 'effector-react';
import { useRef } from 'react';
import type { ChangeEvent } from 'react';

import type { AudioAnalysisFeature } from '../model';

import { LevelMeters } from './level-meters';
import styles from './audio-controls.module.css';

type AudioControlsProps = {
  model: AudioAnalysisFeature;
};

export function AudioControls({ model }: AudioControlsProps) {
  const { inputs, selectedInputId, isLive, errorMessage, refreshInputs, selectInput, selectFile } = useUnit({
    inputs: model.$inputs,
    selectedInputId: model.$selectedInputId,
    isLive: model.$isLive,
    errorMessage: model.$errorMessage,
    refreshInputs: model.inputsRefreshRequested,
    selectInput: model.inputSelected,
    selectFile: model.fileSelected,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputOptions = inputs.map((input) => ({ value: input.id, content: input.label }));

  // Названия устройств доступны только после разрешения, поэтому список грузим при открытии
  const handleSelectOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      refreshInputs();
    }
  };

  const handleInputUpdate = (values: string[]) => {
    const [inputId] = values;

    if (inputId) {
      selectInput(inputId);
    }
  };

  const handleFileButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      selectFile(file);
    }
  };

  return (
    <div className={styles.root}>
      <Select
        width="max"
        placeholder="Источник звука"
        aria-label="Источник звука"
        value={selectedInputId ? [selectedInputId] : []}
        options={inputOptions}
        onOpenChange={handleSelectOpenChange}
        onUpdate={handleInputUpdate}
      />
      <div className={styles.buttons}>
        <Button onClick={handleFileButtonClick}>Файл…</Button>
        <input ref={fileInputRef} type="file" accept="audio/*" hidden onChange={handleFileChange} />
      </div>
      <div className={styles.status}>
        <LevelMeters getReading={model.getLastReading} />
        <Text color="secondary">{isLive ? 'Звук включён' : 'Демо-бит 124 BPM'}</Text>
      </div>
      <Text color="secondary" className={styles.hint}>
        Музыка из любого приложения: поставь BlackHole, выбери его системным выходом (через Multi-Output, чтобы слышать) и укажи здесь «BlackHole 2ch».
      </Text>
      {errorMessage ? <Text color="danger">{errorMessage}</Text> : null}
    </div>
  );
}
