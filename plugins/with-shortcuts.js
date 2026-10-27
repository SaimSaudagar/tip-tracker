/**
 * Quick ways into Log shift without opening the app first:
 * - iOS: Siri phrases ("Log my tips in Tipbook") via App Intents in plugins/siri, compiled
 *   into the main app target.
 * - Android: long-press launcher shortcuts for Log shift and Scan slip.
 * Both open the app's own links (tipbook://log-shift, tipbook://scan), which Expo Router handles.
 */
const { AndroidConfig, IOSConfig, withAndroidManifest, withDangerousMod, withStringsXml, withXcodeProject } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SWIFT_FILE = 'TipbookShortcuts.swift';

const ANDROID_SHORTCUTS = [
  { id: 'log_shift', label: 'Log shift', longLabel: 'Log a shift', path: 'log-shift' },
  { id: 'scan_slip', label: 'Scan slip', longLabel: 'Scan a checkout slip', path: 'scan' },
];

function withSiriShortcuts(config) {
  config = withDangerousMod(config, [
    'ios',
    async (c) => {
      const projectName = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
      fs.copyFileSync(path.join(__dirname, 'siri', SWIFT_FILE), path.join(c.modRequest.platformProjectRoot, projectName, SWIFT_FILE));
      return c;
    },
  ]);
  return withXcodeProject(config, (c) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(c.modRequest.projectRoot);
    const filepath = path.join(projectName, SWIFT_FILE);
    if (!c.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName: projectName, project: c.modResults });
    }
    return c;
  });
}

function withAndroidShortcuts(config) {
  const scheme = Array.isArray(config.scheme) ? config.scheme[0] : config.scheme;
  const packageName = config.android.package;

  config = withStringsXml(config, (c) => {
    for (const s of ANDROID_SHORTCUTS) {
      c.modResults = AndroidConfig.Strings.setStringItem(
        [
          { $: { name: `shortcut_${s.id}_short` }, _: s.label },
          { $: { name: `shortcut_${s.id}_long` }, _: s.longLabel },
        ],
        c.modResults,
      );
    }
    return c;
  });

  config = withDangerousMod(config, [
    'android',
    async (c) => {
      const dir = path.join(c.modRequest.platformProjectRoot, 'app/src/main/res/xml');
      fs.mkdirSync(dir, { recursive: true });
      const items = ANDROID_SHORTCUTS.map(
        (s) => `  <shortcut
    android:shortcutId="${s.id}"
    android:enabled="true"
    android:icon="@mipmap/ic_launcher"
    android:shortcutShortLabel="@string/shortcut_${s.id}_short"
    android:shortcutLongLabel="@string/shortcut_${s.id}_long">
    <intent
      android:action="android.intent.action.VIEW"
      android:targetPackage="${packageName}"
      android:targetClass="${packageName}.MainActivity"
      android:data="${scheme}://${s.path}" />
  </shortcut>`,
      ).join('\n');
      fs.writeFileSync(
        path.join(dir, 'shortcuts.xml'),
        `<?xml version="1.0" encoding="utf-8"?>\n<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">\n${items}\n</shortcuts>\n`,
      );
      return c;
    },
  ]);

  return withAndroidManifest(config, (c) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(c.modResults);
    activity['meta-data'] = (activity['meta-data'] ?? []).filter((m) => m.$['android:name'] !== 'android.app.shortcuts');
    activity['meta-data'].push({ $: { 'android:name': 'android.app.shortcuts', 'android:resource': '@xml/shortcuts' } });
    return c;
  });
}

module.exports = (config) => withAndroidShortcuts(withSiriShortcuts(config));
