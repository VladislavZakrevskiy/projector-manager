import { createSpectrumSource } from '../lib/spectrum-source';

import { createAudioAnalysisFeature } from './factory';

export { createAudioAnalysisFeature } from './factory';
export type { AudioAnalysisDeps, AudioAnalysisFeature } from './factory';

export const audioAnalysisFeature = createAudioAnalysisFeature({ source: createSpectrumSource() });
