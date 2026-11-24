import { balloonPopGame } from './balloonPop.js';
import { starCatcherGame } from './starCatcher.js';
import { bubblePopGame } from './bubblePop.js';
export { unlockAudio } from './shared.js';

export const GAMES = {
    whackAMole: balloonPopGame,
    starCatcher: starCatcherGame,
    bubblePop: bubblePopGame
};