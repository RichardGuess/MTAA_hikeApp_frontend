import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';

const TILE_FOLDER = FileSystem.documentDirectory + 'tiles/';

function getTilePath(z: number, x: number, y: number) {
  return `${TILE_FOLDER}${z}_${x}_${y}.png`;
}

function getTileUrl(z: number, x: number, y: number) {
  return `https://c.tile.openstreetmap.org/${z}/${x}/${y}.png`;
}

const OfflineMap = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return unsubscribe;
  }, []);

  // Custom tile handler
  const renderTile = ({ x, y, z }: { x: number; y: number; z: number }) => {
    const tilePath = getTilePath(z, x, y);

    return FileSystem.getInfoAsync(tilePath)
      .then(info => {
        if (info.exists) {
          return Platform.OS === 'android'
            ? `file://${tilePath}`
            : tilePath;
        } else {
          return FileSystem.downloadAsync(
            getTileUrl(z, x, y),
            tilePath
          ).then(() => (Platform.OS === 'android' ? `file://${tilePath}` : tilePath));
        }
      })
      .catch(err => {
        console.error('Tile fetch error:', err);
        return getTileUrl(z, x, y); // fallback to online
      });
  };

  return (
    <MapView style={{ flex: 1 }}>
      <UrlTile
        /**
         * This is a trick: we give it a template, but let tile images be redirected
         * to local files by intercepting requests via caching logic
         */
        urlTemplate={
          isOffline
            ? `${FileSystem.documentDirectory}tiles/{z}_{x}_{y}.png`
            : 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        }
        maximumZ={19}
        flipY={false}
      />
    </MapView>
  );
};

export default OfflineMap;
