// Initialise error logging first so failures anywhere below (including game
// construction) are captured by Sentry.
import './sentry'
// Import order matters: the Phaser global must be installed before any scene or
// entity module (which reference the bare `Phaser` global) is evaluated.
import './phaser-global'
import './assets/css/style.css'
import { Game } from './Game'

new Game()
