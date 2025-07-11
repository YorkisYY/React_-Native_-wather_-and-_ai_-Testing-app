// src/services/api/weather.ts
import axios from 'axios';
import { LocationService } from './location';

export interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  city: string;
  country: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

export class WeatherService {

  static async getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
    try {
      const response = await axios.get(`https://wttr.in/${lat},${lon}`, {
        params: {
          format: 'j1'
        }
      });

      const data = response.data;
      const current = data.current_condition[0];
      const nearest = data.nearest_area[0];
      
      return {
        temperature: parseInt(current.temp_C),
        condition: current.weatherDesc[0].value,
        description: current.weatherDesc[0].value.toLowerCase(),
        city: nearest.areaName[0].value,
        country: nearest.country[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseFloat(current.windspeedKmph) / 3.6, 
        icon: this.getIconFromCondition(current.weatherDesc[0].value)
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data');
    }
  }


  static async getWeatherByCity(city: string): Promise<WeatherData> {
    try {
      const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}`, {
        params: {
          format: 'j1'
        }
      });

      const data = response.data;
      const current = data.current_condition[0];
      const nearest = data.nearest_area[0];
      
      return {
        temperature: parseInt(current.temp_C),
        condition: current.weatherDesc[0].value,
        description: current.weatherDesc[0].value.toLowerCase(),
        city: nearest.areaName[0].value,
        country: nearest.country[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: parseFloat(current.windspeedKmph) / 3.6,
        icon: this.getIconFromCondition(current.weatherDesc[0].value)
      };
    } catch (error) {
      console.error('Weather API error:', error);
      throw new Error('Failed to fetch weather data');
    }
  }


  static async getCurrentLocationWeather(): Promise<WeatherData> {
    try {

      const location = await LocationService.getCurrentLocation();
      

      return await this.getWeatherByCoordinates(
        location.latitude, 
        location.longitude
      );
    } catch (error) {
      console.error('Current location weather error:', error);
      throw error;
    }
  }


  static getIconFromCondition(condition: string): string {
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes('sunny') || conditionLower.includes('clear')) return '01d';
    if (conditionLower.includes('cloudy')) return '03d';
    if (conditionLower.includes('rain')) return '10d';
    if (conditionLower.includes('snow')) return '13d';
    if (conditionLower.includes('thunder')) return '11d';
    if (conditionLower.includes('mist') || conditionLower.includes('fog')) return '50d';
    
    return '01d'; 
  }


  static getMockWeather(): WeatherData {
    return {
      temperature: Math.floor(Math.random() * 15) + 15,
      condition: 'Sunny',
      description: 'clear sky',
      city: 'Demo Location',
      country: 'Demo',
      humidity: Math.floor(Math.random() * 30) + 50,
      windSpeed: Math.random() * 10 + 2,
      icon: '01d'
    };
  }
}