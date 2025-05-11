// OfflineMap.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

export default function OfflineMap() {
  const [htmlUri, setHtmlUri] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadHtml = async () => {
      const asset = Asset.fromModule(require('./osmMap.html'));
      await asset.downloadAsync();
      setHtmlUri(asset.localUri);
    };
    loadHtml();
  }, []);

  if (!htmlUri) return null;

  return (
    <View style={styles.container}>
      <WebView originWhitelist={['*']} source={{ uri: htmlUri }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});