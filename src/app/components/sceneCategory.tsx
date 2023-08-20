'use client';

import { sortIndexSortFn } from '@/lib/utils';
import { SceneData, WebsocketCommand } from '@/models';
import { FC, useEffect, useState } from 'react';
import ManageScene from './manageScene';
import React from 'react';
import 'rc-slider/assets/index.css';
import SceneCard from './sceneCard';
import AddSceneButton from './addSceneButton';

type Props = {
    disabled: boolean;
    isEditing: boolean;
    categoryName: string;
    allScenes: SceneData[];
    sendCommand: (command: WebsocketCommand) => void;
};

const SceneCategory: FC<Props> = ({ sendCommand, allScenes, categoryName, isEditing, disabled }: Props) => {
    var [date, setDate] = useState(Date.now());
    const [sceneToEdit, setSceneToEdit] = useState<SceneData | null>(null);

    useEffect(() => {
        var timer = setInterval(() => setDate(Date.now()), 100);
        return function cleanup() {
            clearInterval(timer);
        };
    });

    const scenes = allScenes.filter((x) => x.category === categoryName);
    const isFading = (scene: SceneData) => date < scene.fadeEnableCompleted || date < scene.fadeDisableCompleted;
    const nextSortIndex = Math.max(0, ...scenes.map((x) => x.sortIndex)) + 1;

    return (
        <div className="relative flex flex-col mt-8">
            <div className="flex justify-start items-baseline gap-3">
                <h1 className="relative flex-none mb-3 text-2xl font-semibold">{categoryName}</h1>
                {scenes.some((x) => x.enabled || isFading(x)) ? (
                    <div className="relative uppercase text-teal-400">Active</div>
                ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 grid-flow-row-dense md:grid-cols-3 lg:grid-cols-5">
                {scenes.sort(sortIndexSortFn).map((scene) => (
                    <React.Fragment key={scene.id}>
                        <SceneCard
                            disabled={disabled}
                            isEditing={isEditing}
                            allScenes={allScenes}
                            scene={scene}
                            sendCommand={sendCommand}
                            isEditingThisScene={sceneToEdit?.id === scene.id}
                            setSceneToEdit={setSceneToEdit}
                        />
                        {isEditing && sceneToEdit && sceneToEdit.id == scene.id ? (
                            <div className="col-span-1 md:col-span-3 lg:col-span-5">
                                <ManageScene
                                    disabled={disabled}
                                    sceneToEdit={sceneToEdit}
                                    nextSortIndex={nextSortIndex}
                                    setSceneToEdit={setSceneToEdit}
                                    sendCommand={sendCommand}
                                />
                            </div>
                        ) : null}
                    </React.Fragment>
                ))}
                {isEditing ? (
                    <AddSceneButton
                        disabled={disabled}
                        isEditing={isEditing}
                        nextSortIndex={nextSortIndex}
                        categoryName={categoryName}
                        allScenes={allScenes}
                        sendCommand={sendCommand}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default SceneCategory;
