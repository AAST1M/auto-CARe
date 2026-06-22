import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, Linking, Platform } from 'react-native';
import { MapPin, Star, Phone, Clock, Wrench } from 'lucide-react-native';
import { API_URL } from '../config';

interface Workshop {
  id: string;
  name: string;
  rating: number;
  distance: string;
  image: string;
  specialty: string;
  priceEstimate?: string;
  address?: string;
  hours?: string;
  services?: string[];
  lat?: number;
  lng?: number;
}

export default function FindWorkshopScreen() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkshops = async () => {
      try {
        const response = await fetch(`${API_URL}/api/workshops`);
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setWorkshops(data);
        } else {
          // Fallback data
          setWorkshops([
            { id: '1', name: 'Al-Ahlia Mechanics', image: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=500', rating: 4.8, distance: '1.2 km', lat: 30.0444, lng: 31.2357, address: 'Tahrir Square', specialty: 'European Cars', services: ['Mechanical', 'Electrical'] },
            { id: '2', name: 'QuickFix Auto', image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500', rating: 4.5, distance: '2.5 km', lat: 30.0500, lng: 31.2400, address: 'Downtown', specialty: 'General Repair', services: ['Tires', 'Mechanical'] }
          ]);
        }
      } catch (error) {
        console.error('Failed to fetch workshops:', error);
        setWorkshops([
          { id: '1', name: 'Al-Ahlia Mechanics', image: 'https://images.unsplash.com/photo-1613214149922-f1809c99b414?w=500', rating: 4.8, distance: '1.2 km', lat: 30.0444, lng: 31.2357, address: 'Tahrir Square', specialty: 'European Cars', services: ['Mechanical', 'Electrical'] },
          { id: '2', name: 'QuickFix Auto', image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=500', rating: 4.5, distance: '2.5 km', lat: 30.0500, lng: 31.2400, address: 'Downtown', specialty: 'General Repair', services: ['Tires', 'Mechanical'] }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, []);

  const openMap = (lat?: number, lng?: number, name?: string) => {
    if (!lat || !lng) return;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const label = name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const renderWorkshop = ({ item }: { item: Workshop }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Star size={12} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        
        <Text style={styles.specialty}>{item.specialty}</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.infoText}>{item.distance}</Text>
          </View>
          {item.hours && (
            <View style={styles.infoItem}>
              <Clock size={14} color="#64748b" />
              <Text style={styles.infoText}>{item.hours}</Text>
            </View>
          )}
        </View>

        <View style={styles.servicesRow}>
          {item.services?.map((service, index) => (
            <View key={index} style={styles.serviceBadge}>
              <Text style={styles.serviceText}>{service}</Text>
            </View>
          ))}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionButtonSecondary}>
            <Phone size={18} color="#3b82f6" />
            <Text style={styles.actionTextSecondary}>Call</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButtonPrimary}
            onPress={() => openMap(item.lat, item.lng, item.name)}
          >
            <MapPin size={18} color="#fff" />
            <Text style={styles.actionTextPrimary}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={workshops}
        keyExtractor={item => item.id}
        renderItem={renderWorkshop}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
  },
  specialty: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
  },
  servicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    gap: 8,
  },
  actionTextSecondary: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#10b981',
    gap: 8,
  },
  actionTextPrimary: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
