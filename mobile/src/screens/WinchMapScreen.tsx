import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import * as Location from 'expo-location';
import io, { Socket } from 'socket.io-client';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';

interface WinchOffer {
  id: string;
  driverName: string;
  price: number;
  eta: string;
  rating: number;
  vehicle: string;
  status: 'pending' | 'accepted' | 'rejected';
  driverId: string;
  driverSocketId: string;
  lat: number;
  lng: number;
}

export default function WinchMapScreen() {
  const { user, token } = useAuth();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const [status, setStatus] = useState<'IDLE' | 'SEARCHING' | 'NEGOTIATING' | 'CONFIRMED'>('IDLE');
  const [activeOffers, setActiveOffers] = useState<WinchOffer[]>([]);
  const [driver, setDriver] = useState<any>(null);
  const [dropoffLat, setDropoffLat] = useState<string>('');
  const [dropoffLng, setDropoffLng] = useState<string>('');
  const mapRef = useRef<MapView>(null);
  
  const socketRef = useRef<Socket | null>(null);

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

  const connectAndSearch = () => {
    if (!location) {
      Alert.alert('Error', 'Wait for location to load');
      return;
    }

    setStatus('SEARCHING');

    const newSocket = io(API_URL, {
      auth: { token }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Mobile Socket connected:', newSocket.id);
      
      // Register this user
      if (user) {
         newSocket.emit('register_user', user.id);
      }
      
      newSocket.emit('get_drivers');
    });

    newSocket.on('drivers_updated', (drivers: any[]) => {
      if (drivers.length > 0) {
        const mapped: WinchOffer[] = drivers.map((d: any) => ({
          id: d.socketId,
          driverName: d.driverName,
          price: d.price || 500,
          eta: '~10 min',
          rating: 4.8,
          vehicle: d.vehicle || 'Winch Truck',
          status: 'pending',
          driverId: d.driverId,
          driverSocketId: d.socketId,
          lat: location.coords.latitude + (Math.random() - 0.5) * 0.02,
          lng: location.coords.longitude + (Math.random() - 0.5) * 0.02,
        }));
        setActiveOffers(mapped);
        setStatus('NEGOTIATING');
      } else {
        setStatus('SEARCHING'); // No drivers online yet
      }
    });

    newSocket.on('booking_confirmed', (data) => {
      setDriver(data);
      setStatus('CONFIRMED');
    });

    newSocket.on('driver_location', (loc) => {
      console.log('Driver moved to:', loc);
      // In a real app, update a map marker here
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  };

  const handleRequestDriver = (offer: WinchOffer) => {
    if (!socketRef.current || !location || !user) return;
    
    socketRef.current.emit('request_driver', {
      customerId: user.id,
      customerName: user.name || 'Customer',
      driverSocketId: offer.driverSocketId,
      car: 'My Car', // Could get from profile
      issue: 'Breakdown assistance',
      price: offer.price,
      lat: location.coords.latitude,
      lng: location.coords.longitude,
    });
    
    Alert.alert('Request Sent', `Waiting for ${offer.driverName} to accept...`);
  };

  const adjustOfferPrice = (offerId: string, amount: number) => {
    setActiveOffers(prev => prev.map(offer => {
      if (offer.id === offerId) {
        return { ...offer, price: Math.max(50, offer.price + amount) };
      }
      return offer;
    }));
  };

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {location ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            showsUserLocation
          >
            <Marker 
              coordinate={{ latitude: location.coords.latitude, longitude: location.coords.longitude }} 
              title="You are here" 
              pinColor="blue"
            />
            {/* Draw driver markers if searching/negotiating */}
            {activeOffers.map(offer => (
              <Marker
                key={offer.id}
                coordinate={{ latitude: offer.lat, longitude: offer.lng }}
                title={offer.driverName}
                description={`${offer.price} EGP`}
              >
                <View style={styles.driverMarker}>
                  <Text style={styles.driverMarkerText}>🚜</Text>
                </View>
              </Marker>
            ))}
            {/* Draw line if dropoff is set */}
            {dropoffLat && dropoffLng && !isNaN(parseFloat(dropoffLat)) && !isNaN(parseFloat(dropoffLng)) && (
              <>
                <Marker 
                  coordinate={{ latitude: parseFloat(dropoffLat), longitude: parseFloat(dropoffLng) }} 
                  title="Drop-off" 
                  pinColor="red"
                />
                <Polyline
                  coordinates={[
                    { latitude: location.coords.latitude, longitude: location.coords.longitude },
                    { latitude: parseFloat(dropoffLat), longitude: parseFloat(dropoffLng) }
                  ]}
                  strokeColor="#3b82f6"
                  strokeWidth={3}
                />
              </>
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapText}>Loading GPS...</Text>
          </View>
        )}
      </View>

      <View style={styles.panel}>
        {status === 'IDLE' && (
          <View>
            <Text style={styles.sectionTitle}>Set Drop-off Destination</Text>
            <View style={styles.inputRow}>
              <TextInput style={styles.input} placeholder="Lat (e.g. 30.0444)" value={dropoffLat} onChangeText={setDropoffLat} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Lng (e.g. 31.2357)" value={dropoffLng} onChangeText={setDropoffLng} keyboardType="numeric" />
            </View>
            <TouchableOpacity style={styles.button} onPress={connectAndSearch}>
              <Text style={styles.buttonText}>Find Nearby Winches</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'SEARCHING' && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.statusText}>Searching for online drivers...</Text>
            <TouchableOpacity style={[styles.button, { marginTop: 20, backgroundColor: '#ef4444' }]} onPress={() => { setStatus('IDLE'); socket?.disconnect(); }}>
              <Text style={styles.buttonText}>Cancel Search</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {status === 'NEGOTIATING' && (
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Available Drivers ({activeOffers.length})</Text>
            <ScrollView>
              {activeOffers.map(offer => (
                <View key={offer.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{offer.driverName}</Text>
                    <Text style={styles.price}>{offer.price} EGP</Text>
                  </View>
                  <Text style={styles.cardSub}>{offer.vehicle} • ★ {offer.rating}</Text>
                  
                  <View style={styles.negotiationControls}>
                    <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustOfferPrice(offer.id, -20)}>
                      <Text style={styles.adjustBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.adjustLabel}>Adjust Offer</Text>
                    <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustOfferPrice(offer.id, 20)}>
                      <Text style={styles.adjustBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.cardButton} onPress={() => handleRequestDriver(offer)}>
                    <Text style={styles.cardButtonText}>Send Offer</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {status === 'CONFIRMED' && driver && (
          <View style={styles.center}>
            <Text style={styles.successTitle}>Driver En Route!</Text>
            <Text style={styles.driverText}>{driver.driverName || 'Your driver'} accepted the request.</Text>
            <Text style={styles.driverText}>They are heading to your location now.</Text>
            <View style={styles.liveTrackingBadge}>
              <View style={styles.dot} />
              <Text style={styles.liveTrackingText}>Live GPS Tracking Active</Text>
            </View>
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
  mapContainer: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  driverMarker: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  driverMarkerText: {
    fontSize: 16,
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
    flex: 1,
    justifyContent: 'center',
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
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#0f172a',
  },
  card: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  cardSub: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  cardButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  liveTrackingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  liveTrackingText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  negotiationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  adjustBtn: {
    backgroundColor: '#fff',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  adjustBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155',
  },
  adjustLabel: {
    fontWeight: '600',
    color: '#475569',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
  }
});
