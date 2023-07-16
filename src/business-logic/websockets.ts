import { Store } from 'redux';
import { WebSocketServer, WebSocket } from 'ws';
import { getLastReceivedDmxDataForUniverse } from './redux/currentDmxSlice';
import {
    addScene,
    deleteScene,
    disableScene,
    enableScene,
    removeDmxFromScene,
    storeDmxToScene,
    updateScene,
} from './redux/scenesSlice';
import { RootState } from './redux/store';
import { getScenes } from './redux/scenesSlice';

export const configureWebsockets = (store: Store<RootState>) => {
    const wss = new WebSocketServer({ port: 8080 });

    wss.on('connection', (ws) => {
        ws.on('error', console.error);

        ws.on('message', (data) => {
            handleIncomingMessage(store, data.toString());
        });

        ws.send(JSON.stringify(getScenes(store.getState())));
    });

    return {
        broadcast: (data: any, isBinary: boolean) =>
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data, { binary: isBinary });
                }
            }),
    };
};

type WebsocketCommand = {
    type: 'enable' | 'disable' | 'add' | 'update' | 'delete' | 'storeDmx' | 'removeDmx';
    sceneId?: string;
    metadata?: { name: string; color: string };
    universes?: number[];
};

const handleIncomingMessage = (store: Store<RootState>, data: string) => {
    let command: WebsocketCommand | null | undefined;

    try {
        command = JSON.parse(data);
    } catch (e) {
        console.log('[WEBSOCKET CMD] Invalid JSON (exception)');
        return;
    }

    if (!command) {
        console.log('[WEBSOCKET CMD] Invalid JSON (undefined)');
        return;
    }

    switch (command.type) {
        case 'enable':
            if (!command.sceneId) {
                break;
            }
            store.dispatch(enableScene(command.sceneId));
            console.log('[WEBSOCKET CMD] Executed enable');
            break;

        case 'disable':
            if (!command.sceneId) {
                break;
            }
            store.dispatch(disableScene(command.sceneId));
            console.log('[WEBSOCKET CMD] Executed disable');
            break;

        case 'add':
            if (!command.metadata) {
                break;
            }
            store.dispatch(addScene(command.metadata));
            console.log('[WEBSOCKET CMD] Executed add');
            break;

        case 'delete':
            if (!command.sceneId) {
                break;
            }
            store.dispatch(deleteScene(command.sceneId));
            console.log('[WEBSOCKET CMD] Executed delete');
            break;

        case 'update':
            if (!command.sceneId) {
                break;
            }
            if (!command.metadata) {
                break;
            }
            store.dispatch(updateScene({ id: command.sceneId, ...command.metadata }));
            console.log('[WEBSOCKET CMD] Executed update');
            break;

        case 'storeDmx':
            if (!command.sceneId) {
                break;
            }
            if (!command.universes) {
                break;
            }

            const dmxToStore = command.universes.map((universeId) =>
                getLastReceivedDmxDataForUniverse(store.getState(), universeId),
            );

            store.dispatch(storeDmxToScene({ id: command.sceneId, dmx: dmxToStore }));
            console.log('[WEBSOCKET CMD] Executed storeDmx');
            break;

        case 'removeDmx':
            if (!command.sceneId) {
                break;
            }
            if (!command.universes) {
                break;
            }

            const dmxToRemove = command.universes.map((universeId) =>
                getLastReceivedDmxDataForUniverse(store.getState(), universeId),
            );
            store.dispatch(removeDmxFromScene({ id: command.sceneId, dmx: dmxToRemove }));
            console.log('[WEBSOCKET CMD] Executed removeDmx');
            break;

        default:
            console.log('[WEBSOCKET CMD] Unknown command');
    }
};