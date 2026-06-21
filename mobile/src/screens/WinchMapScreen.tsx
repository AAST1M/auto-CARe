import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

export default function WinchMapScreen() {
  const { user, token } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'SEARCHING' | 'ACCEPTED'>('IDLE');
  const [driver, setDriver] = useState<any>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const requestWinch = async () => {
    if (!location) {
      Alert.alert('Error', 'Wait for location to load');
      return;
    }

    try {
      setStatus('SEARCHING');

      // 1. Create booking in DB
      const res = await fetch(`${API_URL}/api/winch/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        })
      });

      if (!res.ok) throw new Error('Failed to create booking');
      const booking = await res.json();

      // 2. Connect Socket
      const newSocket = io(API_URL, {
        query: { userId: user?.id, role: 'USER' }
      });

      newSocket.on('connect', () => {
        newSocket.emit('request_winch', {
          bookingId: booking.id,
          location: { lat: location.coords.latitude, lng: location.coords.longitude }
        });
      });

      newSocket.on('winch_offer', (offer) => {
        // Automatically accept first offer for now
        setDriver(offer.driver);
        setStatus('ACCEPTED');
      });

      newSocket.on('driver_location', (loc) => {
        console.log('Driver moved to:', loc);
        // In a real app, update a map marker here
      });

      setSocket(newSocket);
    } catch (err: any) {
      Alert.alert('Error', err.message);
      setStatus('IDLE');
    }
  };

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  return (
    <View style={styles.container}>
      {/* Placeholder for MapView (react-native-maps) */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>
          {location 
            ? `Map Loaded\nLat: ${location.coords.latitude.toFixed(4)}\nLng: ${location.coords.longitude.toFixed(4)}`
            : 'Loading GPS...'}
        </Text>
      </View>

      <View style={styles.panel}>
        {status === 'IDLE' && (
          <TouchableOpacity style={styles.button} onPress={requestWinch}>
            <Text style={styles.buttonText}>Request Winch Now</Text>
          </TouchableOpacity>
        )}

        {status === 'SEARCHING' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.statusText}>Searching for nearby drivers...</Text>
          </View>
        )}

        {status === 'ACCEPTED' && driver && (
          <View>
            <Text style={styles.successTitle}>Driver En Route!</Text>
            <Text style={styles.driverText}>{driver.name} is on their way.</Text>
            <Text style={styles.driverText}>Vehicle: {driver.vehicleModel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapPlaceholder: {
    flex: 2,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  panel: {
    flex: 1,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#fff',
    marginTop: -24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  center: {
    alignItems: 'center',
  },
  statusText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 8,
  },
  driverText: {
    fontSize: 16,
    color: '#334155',
    marginBottom: 4,
  }
});
