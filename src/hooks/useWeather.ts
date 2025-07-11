// src/hooks/useWeather.ts
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { WeatherService, WeatherData } from '../services/api/weather';

export const useWeather = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useLocation, setUseLocation] = useState(true);
  const [hasLocationPermission, setHasLocationPermission] = useState<boolean | null>(null);

  const fetchWeather = async (forceLocation = false) => {
    setLoading(true);
    setError(null);
    
    try {
      let weatherData: WeatherData;
      
      if (useLocation || forceLocation) {
        try {

          weatherData = await WeatherService.getCurrentLocationWeather();
          setHasLocationPermission(true);
          

          if (forceLocation) {
            Alert.alert(
              'Location Found!', 
              `Weather data for ${weatherData.city}, ${weatherData.country}`,
              [{ text: 'OK' }]
            );
          }
        } catch (locationError) {
          console.log('Location failed:', locationError);
          setHasLocationPermission(false);
          

          if (forceLocation) {
            Alert.alert(
              'Location Access',
              'Unable to get your location. This could be due to:\n\n• Location permission denied\n• GPS disabled\n• Network connectivity issues\n\nWould you like to use demo weather data instead?',
              [
                {
                  text: 'Try Again',
                  onPress: () => fetchWeather(true),
                },
                {
                  text: 'Use Demo Data',
                  onPress: () => {
                    setUseLocation(false);
                    setWeather(WeatherService.getMockWeather());
                    setLoading(false);
                  },
                },
              ]
            );
            return;
          } else {

            throw locationError;
          }
        }
      } else {

        weatherData = WeatherService.getMockWeather();
      }
      
      setWeather(weatherData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather';
      setError(errorMessage);
      

      setWeather(WeatherService.getMockWeather());
      setUseLocation(false);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchWeather();
  }, []);

  const refreshWeather = () => {
    fetchWeather(useLocation);
  };

  const toggleLocationMode = () => {
    const newLocationMode = !useLocation;
    setUseLocation(newLocationMode);
    
    if (newLocationMode && hasLocationPermission === false) {

      Alert.alert(
        'Location Permission',
        'To use your location for weather data, please:\n\n1. Go to iPhone Settings\n2. Privacy & Security → Location Services\n3. Find Expo Go and enable location access\n4. Return to the app and try again',
        [
          { text: 'OK', onPress: () => fetchWeather(true) }
        ]
      );
    } else {
      fetchWeather(newLocationMode);
    }
  };

  const requestLocationPermission = () => {
    fetchWeather(true);
  };

  return {
    weather,
    loading,
    error,
    refreshWeather,
    toggleLocationMode,
    requestLocationPermission,
    useLocation,
    hasLocationPermission
  };
};

export type { WeatherData } from '../services/api/weather';