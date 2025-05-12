import MapView, { UrlTile } from 'react-native-maps';

<MapView style={{ flex: 1 }}>
  <UrlTile
    urlTemplate="http://c.tile.openstreetmap.org/{z}/{x}/{y}.png"
    maximumZ={19}
  />
</MapView>