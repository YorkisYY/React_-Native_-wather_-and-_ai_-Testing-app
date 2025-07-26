// src/screens/HomeScreen.tsx - 引用拆分组件，保持原本外观
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView
} from 'react-native';
import WeatherCard from '../components/weather/WeatherCard';
import { useWeather } from '../hooks/useWeather';
import ChatScreen from './ChatScreen';     // 引用聊天和语音功能
import WeatherScreen from './WeatherScreen'; // 引用AR功能

export default function HomeScreen() {
  const { weather, loading, refreshWeather, toggleLocationMode, useLocation } = useWeather();
  
  // AR 狀態传递给子组件
  const [isARMode, setIsARMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI Pet Assistant</Text>
        <Text style={styles.subtitle}>Your AI companion with Camera AR!</Text>
        
        <WeatherCard 
          weather={weather}
          loading={loading}
          onRefresh={refreshWeather}
          onToggleLocation={toggleLocationMode}
          useLocation={useLocation}
        />
        
        {/* 聊天和语音功能组件 */}
        <ChatScreen isARMode={isARMode} />
        
        {/* AR功能组件 */}
        <WeatherScreen />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
});