import { balloonPopGame } from './balloonPop.js';
import { starCatcherGame } from './starCatcher.js';
import { bubblePopGame } from './bubblePop.js';
import { binocularMatchGame } from './binocularMatch.js';

export { unlockAudio } from './shared.js';

export const GAMES = {
    whackAMole: balloonPopGame,
    starCatcher: starCatcherGame,
    bubblePop: bubblePopGame,
    binocularMatch: binocularMatchGame
};