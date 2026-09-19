import { Platform, Vibration } from 'react-native';
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';

const alarmSource = require('../../../assets/full-bin-alarm.wav');

let alarmPlayer: AudioPlayer | null = null;
let audioConfigured = false;
let alarmRequestId = 0;

function getAlarmPlayer(): AudioPlayer {
  // This is a bundled asset, so give it to the native player immediately.
  // `downloadFirst` creates an empty player while the download resolves and a
  // play call during that window can fail on some Expo Go/native versions.
  alarmPlayer ??= createAudioPlayer(alarmSource);
  alarmPlayer.loop = true;
  alarmPlayer.volume = 0.92;
  return alarmPlayer;
}

async function configureAudio(): Promise<void> {
  if (audioConfigured) return;

  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'duckOthers',
  });
  audioConfigured = true;
}

const androidAlarmPattern = [0, 700, 250, 700, 250, 1_100];
const iosAlarmPattern = [0, 700, 250, 700, 250, 1_100];

/** Starts a repeating, in-app paging alarm plus strong device vibration. */
export async function triggerAlarmFeedback(
  _binName: string,
  _fillPercent: number,
): Promise<void> {
  const requestId = ++alarmRequestId;

  // Audio, vibration, and haptics are enhancements. A failure in any one of
  // them must not crash or hide the collection instructions.
  try {
    await configureAudio();
    if (requestId !== alarmRequestId) return;
    const player = getAlarmPlayer();
    await player.seekTo(0);
    if (requestId !== alarmRequestId) return;
    player.play();
  } catch (error) {
    console.warn('Unable to start the EcoSort alarm sound.', error);
  }

  if (requestId !== alarmRequestId) return;

  // Let the short native haptic finish before starting the repeating vibration.
  // Starting haptics after Vibration.vibrate can replace the active Android
  // vibration request, which made the repeating pattern appear to do nothing.
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.warn('Unable to start EcoSort haptic feedback.', error);
  }

  if (requestId !== alarmRequestId) return;

  try {
    Vibration.cancel();
    Vibration.vibrate(
      Platform.OS === 'ios' ? iosAlarmPattern : androidAlarmPattern,
      true,
    );
  } catch (error) {
    console.warn('Unable to start the EcoSort alarm vibration.', error);
  }
}

/** Stops both the audible alarm and all haptic feedback. */
export function stopAlarmFeedback(): void {
  // Cancel an alarm that may still be waiting for the native audio session.
  alarmRequestId += 1;

  try {
    if (alarmPlayer) {
      alarmPlayer.pause();
      void alarmPlayer.seekTo(0).catch((error) => {
        console.warn('Unable to rewind the EcoSort alarm sound.', error);
      });
    }
  } catch (error) {
    console.warn('Unable to stop the EcoSort alarm sound.', error);
  }

  try {
    Vibration.cancel();
  } catch (error) {
    console.warn('Unable to stop the EcoSort alarm vibration.', error);
  }
}
