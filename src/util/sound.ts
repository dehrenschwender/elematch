// Sound preference (persisted) + Web Audio unlock.
//
// Browsers create the Web Audio context in a "suspended" state and only allow it
// to start after a user gesture — hence the console notice "An AudioContext was
// prevented from starting automatically." Phaser unlocks on interaction too, but
// we attach our own one-shot resume so the very first tap/key reliably starts
// audio, and we apply the persisted mute preference at boot.

const SOUND_KEY = 'elematch:sound'

/** A Phaser SoundManager that may expose a Web Audio context (WebAudio backend). */
type MaybeWebAudio = Phaser.Sound.NoAudioSoundManager & { context?: AudioContext }

export function isSoundEnabled (): boolean {
  try {
    return window.localStorage.getItem(SOUND_KEY) !== 'off'
  } catch {
    // localStorage can throw in private mode / when storage is disabled.
    return true
  }
}

/** Persist the preference and apply it to the running game immediately. */
export function setSoundEnabled (game: Phaser.Game, enabled: boolean): void {
  try {
    window.localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off')
  } catch {
    // Ignore storage failures — the in-session mute below still takes effect.
  }
  game.sound.mute = !enabled
}

/**
 * Apply the persisted mute preference and unlock Web Audio on the first user
 * gesture. Call once, after the game has booted (e.g. from the Preload scene).
 */
export function initSound (game: Phaser.Game): void {
  game.sound.mute = !isSoundEnabled()

  const ctx = (game.sound as MaybeWebAudio).context
  if (!ctx) {
    return // HTML5 Audio / NoAudio backend — nothing to resume.
  }

  const events = ['pointerdown', 'touchend', 'keydown']
  const resume = () => {
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }
    events.forEach((ev) => window.removeEventListener(ev, resume))
  }
  events.forEach((ev) => window.addEventListener(ev, resume))
}
