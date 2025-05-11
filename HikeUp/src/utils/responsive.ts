import { Dimensions } from 'react-native';

export const isTablet = (): boolean => {
  const { width, height } = Dimensions.get('window');
  return Math.min(width, height) >= 768; // or 720/800 depending on preference
};
