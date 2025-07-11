// src/components/weather/WeatherCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WeatherData } from '../../hooks/useWeather';

interface WeatherCardProps {
  weather: WeatherData | null;
  loading: boolean;
  onRefresh: () => void;
  onToggleLocation?: () => void;
  useLocation?: boolean;
}

export default function WeatherCard({ 
  weather, 
  loading, 
  onRefresh, 
  onToggleLocation,
  useLocation = true 
}: WeatherCardProps) {
  

  const getApiStatus = () => {
    return 'From wttr.in API';
  };


  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {useLocation ? 'Getting your location...' : 'Loading weather...'}
        </Text>
      </View>
    );
  }


  if (!weather) {
    return (
      <TouchableOpacity style={styles.card} onPress={onRefresh}>
        <Text style={styles.errorText}>No weather data</Text>
        <Text style={styles.retryText}>Tap to retry</Text>
      </TouchableOpacity>
    );
  }


  const getWeatherEmoji = (condition: string) => {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain') || conditionLower.includes('shower')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return '⛈️';
    if (conditionLower.includes('drizzle')) return '🌦️';
    if (conditionLower.includes('mist') || conditionLower.includes('fog')) return '🌫️';
    if (conditionLower.includes('overcast')) return '☁️';
    if (conditionLower.includes('partly')) return '⛅';
    
    return '🌤️'; 
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onRefresh} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.emoji}>{getWeatherEmoji(weather.condition)}</Text>
        <View style={styles.location}>
          <Text style={styles.city}>{weather.city}</Text>
          <Text style={styles.country}>{weather.country}</Text>
          <Text style={styles.locationMode}>
            {useLocation ? '📍 Your Location' : ' Demo Mode'}
          </Text>
          <Text style={styles.apiStatus}>
            {getApiStatus()} • {useLocation ? 'Live Data' : 'Sample Data'}
          </Text>
        </View>
      </View>
      
      <View style={styles.temperature}>
        <Text style={styles.temp}>{weather.temperature}°C</Text>
        <Text style={styles.condition}>{weather.description}</Text>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Humidity</Text>
          <Text style={styles.detailValue}>{weather.humidity}%</Text>
        </View>
        <View style={styles.detailSeparator} />
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Wind Speed</Text>
          <Text style={styles.detailValue}>{weather.windSpeed.toFixed(1)} m/s</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Text style={styles.refreshHint}>Tap to refresh</Text>
        {onToggleLocation && (
          <TouchableOpacity 
            onPress={onToggleLocation} 
            style={styles.toggleButton}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleText}>
              {useLocation ? 'Use Demo' : 'Use Location'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  emoji: {
    fontSize: 50,
    marginRight: 15,
  },
  location: {
    flex: 1,
  },
  city: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  country: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationMode: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 2,
    fontWeight: '600',
  },
  apiStatus: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
  temperature: {
    alignItems: 'center',
    marginVertical: 20,
  },
  temp: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  condition: {
    fontSize: 16,
    color: '#666',
    textTransform: 'capitalize',
    textAlign: 'center',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailSeparator: {
    width: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  refreshHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  toggleButton: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  toggleText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 15,
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    color: '#ff3b30',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  retryText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});