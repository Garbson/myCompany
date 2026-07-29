import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.zlabs.mycompany',
  appName: 'myPaper',
  webDir: 'dist',
  server: {
    url: 'https://mycompany.zlabs.com.br',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: ['mycompany.zlabs.com.br']
  },
  ios: {
    scheme: 'myPaper',
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true
  },
  android: {
    allowMixedContent: false
  }
}

export default config
