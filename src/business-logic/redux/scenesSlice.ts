import { DmxUniverseState, SceneData } from '@/models';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './store';
import { webcrypto } from 'crypto';

const initialState: SceneData[] = [];

const scenesSlice = createSlice({
    name: 'scenes',
    initialState,
    reducers: {
        enableScene(state, action: PayloadAction<string>) {
            const scene = state.find((x) => x.id === action.payload);
            if (!scene) {
                return;
            }

            scene.enabled = true;

            if (scene.fade) {
                scene.fadeEnableCompleted = Date.now() + scene.fade;
            }
        },
        disableScene(state, action: PayloadAction<string>) {
            const scene = state.find((x) => x.id === action.payload);
            if (!scene) {
                return;
            }

            scene.enabled = false;

            if (scene.fade) {
                scene.fadeDisableCompleted = Date.now() + scene.fade;
            }
        },
        toggleScene(state, action: PayloadAction<string>) {
            const scene = state.find((x) => x.id === action.payload);

            if (!scene) {
                return;
            }

            if (scene.enabled) {
                scenesSlice.caseReducers.disableScene(state, action);
            } else {
                scenesSlice.caseReducers.enableScene(state, action);
            }
        },
        setMasterOfScene(state, action: PayloadAction<{ sceneId: string; value: number }>) {
            const scene = state.find((x) => x.id === action.payload.sceneId);

            if (!scene) {
                return;
            }

            scene.master = action.payload.value;
        },
        addScene(state, action: PayloadAction<{ name: string; color: string; category: string; sortIndex: number }>) {
            state.push({
                id: webcrypto.randomUUID(),
                name: action.payload.name,
                color: action.payload.color,
                category: action.payload.category,
                sortIndex: action.payload.sortIndex,
                mqttToggleTopic: null,
                mqttTogglePath: 'event',
                mqttToggleValue: 'button-pressed',
                sinusWaveScale: null,
                sinusWaveOffset: 0,
                sinusWavePeriod: 10000,
                created: Date.now(),
                updated: Date.now(),
                dmxData: {},
                enabled: false,
                master: 0,
                useMaster: false,
                fade: 0,
                fadeEnableCompleted: 0,
                fadeDisableCompleted: 0,
            });
        },
        deleteScene(state, action: PayloadAction<string>) {
            return state.filter((x) => x.id !== action.payload);
        },
        updateScene(
            state,
            action: PayloadAction<{
                id: string;
                name?: string;
                color?: string;
                category?: string | null;
                mqttToggleTopic?: string | null;
                mqttTogglePath?: string;
                mqttToggleValue?: string;
                sinusWaveScale?: number | null;
                sinusWaveOffset?: number;
                sinusWavePeriod?: number;
                sortIndex?: number;
                useMaster?: boolean;
                fade?: number;
            }>,
        ) {
            const scene = state.find((x) => x.id === action.payload.id);

            if (!scene) {
                return;
            }

            const newName = action.payload.name?.trim();
            if (newName && newName.length > 0) {
                scene.name = newName;
                scene.updated = Date.now();
            }

            const newColor = action.payload.color?.trim();
            if (newColor && newColor.length > 0) {
                scene.color = newColor;
                scene.updated = Date.now();
            }

            const newCategory = action.payload.category?.trim();
            if (newCategory && newCategory.length > 0) {
                scene.category = newCategory;
                scene.updated = Date.now();
            }

            const newMqttToggleTopic =
                action.payload.mqttToggleTopic === null ? null : action.payload.mqttToggleTopic?.trim() ?? '';
            if (newMqttToggleTopic !== undefined) {
                scene.mqttToggleTopic = newMqttToggleTopic;
                scene.updated = Date.now();
            }

            const newMqttTogglePath = action.payload.mqttTogglePath?.trim();
            if (newMqttTogglePath) {
                scene.mqttTogglePath = newMqttTogglePath;
                scene.updated = Date.now();
            }

            const newMqttToggleValue = action.payload.mqttToggleValue?.trim();
            if (newMqttToggleValue) {
                scene.mqttToggleValue = newMqttToggleValue;
                scene.updated = Date.now();
            }

            const newSortIndex = action.payload.sortIndex;
            if (newSortIndex !== undefined && newSortIndex !== null) {
                scene.sortIndex = newSortIndex;
                scene.updated = Date.now();
            }

            const newSinusWaveScale = action.payload.sinusWaveScale;
            if (newSinusWaveScale !== undefined) {
                scene.sinusWaveScale = newSinusWaveScale;
                scene.updated = Date.now();
            }

            const newSinusWaveOffset = action.payload.sinusWaveOffset;
            if (newSinusWaveOffset !== undefined && newSinusWaveOffset !== null) {
                scene.sinusWaveOffset = newSinusWaveOffset;
                scene.updated = Date.now();
            }

            const newSinusWavePeriod = action.payload.sinusWavePeriod;
            if (newSinusWavePeriod !== undefined && newSinusWavePeriod !== null) {
                scene.sinusWavePeriod = newSinusWavePeriod;
                scene.updated = Date.now();
            }

            const newUseMaster = action.payload.useMaster;
            if (newUseMaster !== undefined && newUseMaster !== null) {
                scene.useMaster = newUseMaster;
                scene.updated = Date.now();
            }

            const newFade = action.payload.fade;
            if (newFade !== undefined && newFade !== null) {
                scene.fade = newFade;
                scene.updated = Date.now();
            }
        },
        storeDmxToScene(state, action: PayloadAction<{ id: string; dmx: DmxUniverseState[] }>) {
            const scene = state.find((x) => x.id === action.payload.id);

            if (!scene) {
                return;
            }

            scene.dmxData = {};

            action.payload.dmx.forEach((universeData) => {
                scene.dmxData[universeData.universeId] = universeData.dmx;
            });

            scene.updated = Date.now();
        },
        removeDmxFromScene(state, action: PayloadAction<{ id: string; dmx: DmxUniverseState[] }>) {
            const scene = state.find((x) => x.id === action.payload.id);

            if (!scene) {
                return;
            }

            action.payload.dmx.forEach((universeData) => {
                for (const address in universeData.dmx) {
                    const lastReceivedValue = universeData.dmx[address];
                    const storedValue = (scene.dmxData[universeData.universeId] ?? {})[address];
                    if (lastReceivedValue === storedValue && storedValue !== undefined) {
                        delete scene.dmxData[universeData.universeId][address];
                    }
                }
            });

            scene.updated = Date.now();
        },
        reloadScenes(_state, action: PayloadAction<SceneData[]>) {
            return action.payload;
        },
    },
});

export const {
    enableScene,
    disableScene,
    toggleScene,
    setMasterOfScene,
    addScene,
    deleteScene,
    updateScene,
    storeDmxToScene,
    removeDmxFromScene,
    reloadScenes,
} = scenesSlice.actions;

export default scenesSlice.reducer;

export const getScenes = (state: RootState) => state.scenes;

export const getDmxDataToSendForUniverse = (state: RootState, universeId: number) => {
    const now = Date.now();

    const enabledScenes = state.scenes.filter((x) => x.enabled || x.fadeDisableCompleted > now);
    const mergedDmxData = enabledScenes.reduce(
        (merged, scene) => {
            const dmxData = scene.dmxData[universeId];
            const masterDimmer = scene.useMaster ? scene.master / 100 : 1;

            // In order to get a soft change form one fade to another, calculate fade in and out seperatly and take either the min or max value depending on if the enable or disable action was the latest.
            const fadeEnableDimmer =
                scene.fade && scene.fadeEnableCompleted > now
                    ? (scene.fade - (scene.fadeEnableCompleted - now)) / scene.fade
                    : 1;
            const fadeDisableDimmer =
                scene.fade && scene.fadeDisableCompleted > now ? (scene.fadeDisableCompleted - now) / scene.fade : 0;
            const fadeDimmer = scene.fade
                ? scene.fadeEnableCompleted >= scene.fadeDisableCompleted
                    ? Math.max(fadeEnableDimmer, fadeDisableDimmer)
                    : Math.min(fadeEnableDimmer, fadeDisableDimmer)
                : 1;

            const randomNumberFromAddress = (x: number) =>
                Math.abs(Math.sin(x) * 10000 - Math.floor(Math.sin(x) * 10000));

            for (const address in dmxData) {
                // Effect dimmer
                const effectDimmer =
                    scene.sinusWavePeriod && scene.sinusWaveScale
                        ? 1 -
                          (((Math.sin(
                              (now +
                                  (scene.sinusWaveOffset === -1
                                      ? randomNumberFromAddress(parseInt(address) + scene.created) * scene.sinusWavePeriod
                                      : scene.sinusWaveOffset)) *
                                  ((Math.PI * 2) / scene.sinusWavePeriod),
                          ) +
                              1) /
                              2) *
                              scene.sinusWaveScale) /
                              100
                        : 1;
                const value = dmxData[address] * masterDimmer * fadeDimmer * effectDimmer;

                // Merge scenes with HTP
                if (merged[address] && merged[address] > value) {
                    continue;
                }

                merged[address] = value;
            }

            return merged;
        },
        {} as Record<number, number>,
    );

    return mergedDmxData;
};

export const getSceneStatus = (scenes: SceneData[]) => {
    const dictionary: Record<string, boolean> = {};
    scenes.forEach((scene) => (dictionary[scene.id] = scene.enabled ? true : false));
    return dictionary;
};
