// src/services/api/location.ts
import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
}

export class LocationService {
  static async getCurrentLocation(): Promise<LocationData> {
    try {

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }


      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });


      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      const address = reverseGeocode[0];

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        city: address?.city || 'Unknown',
        country: address?.country || 'Unknown',
      };
    } catch (error) {
      console.error('Location service error:', error);
      throw error;
    }
  }
}