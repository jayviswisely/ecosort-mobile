import { Vibration } from 'react-native';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';

const alarmSource = require('../../../assets/full-bin-alarm.wav');

let alarmPlayer: AudioPlayer | null = null;
let audioConfigured = false;

function getAlarmPlayer(): AudioPlayer {
  alarmPlayer ??= createAudioPlayer(alarmSource, { downloadFirst: true });
  alarmPlayer.loop = true;
  alarmPlayer.volume = 0.92;
  return alarmPlayer;
}

async function configureAudio(): Promise<void> {
  if (audioConfigured) return;
  audioConfigured = true;

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'duckOthers',
  });
}

/** Starts a repeating, in-app paging alarm plus strong device haptics. */
export async function triggerAlarmFeedback(
  _binName: string,
  _fillPercent: number,
): Promise<void> {
  const player = getAlarmPlayer();

  // Start immediately to preserve the browser's user-gesture audio allowance.
  void player.seekTo(0);
  player.play();
  void configureAudio();

  Vibration.vibrate([0, 400, 180, 400, 180, 650], true);
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
}

/** Stops both the audible alarm and all haptic feedback. */
export function stopAlarmFeedback(): void {
  if (alarmPlayer) {
    alarmPlayer.pause();
    void alarmPlayer.seekTo(0);
  }
  Vibration.cancel();
}
