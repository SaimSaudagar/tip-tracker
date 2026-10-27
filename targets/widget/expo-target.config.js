/**
 * The iOS home-screen and lock-screen widget (see index.swift). Generated into the Xcode
 * project by @bacons/apple-targets on prebuild; edit these files, never ios/.
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'widget',
  name: 'TipbookWidget',
  displayName: 'Tipbook',
  icon: '../../assets/images/icon.png',
  deploymentTarget: '17.0',
  colors: {
    $accent: { light: '#0B7A4B', dark: '#34D399' },
    brandBackground: { light: '#0B7A4B', dark: '#0F2E22' },
  },
  entitlements: {
    // The same App Group as the app, which writes this week's numbers into it.
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
