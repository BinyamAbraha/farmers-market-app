import { Alert, Linking, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export async function openMapsApp(latitude: number, longitude: number, marketName: string) {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let url = '';
    if (Platform.OS === 'ios') {
      // Try Apple Maps first
      url = `maps://?daddr=${latitude},${longitude}&q=${encodeURIComponent(marketName)}`;
      const canOpenApple = await Linking.canOpenURL(url);
      if (!canOpenApple) {
        // Fallback to Google Maps
        url = `comgooglemaps://?daddr=${latitude},${longitude}&q=${encodeURIComponent(marketName)}`;
        const canOpenGoogle = await Linking.canOpenURL(url);
        if (!canOpenGoogle) {
          // Fallback to browser
          url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        }
      }
    } else {
      // Android: Use geo: URI, fallback to browser
      url = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(marketName)})`;
      const canOpenGeo = await Linking.canOpenURL(url);
      if (!canOpenGeo) {
        url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      }
    }
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Error', 'No maps app found to open directions.');
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'Unable to open maps app.');
  }
}

export async function makePhoneCall(phoneNumber: string) {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Remove all non-numeric except +
    const cleaned = phoneNumber.replace(/[^0-9+]/g, '');
    const url = `tel:${cleaned}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Error', 'This device cannot make phone calls.');
      return;
    }
    await Linking.openURL(url);
  } catch (error) {
    Alert.alert('Error', 'Unable to open phone dialer.');
  }
}

export async function openWebsite(url: string) {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Validate URL
    let validUrl = url;
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = 'https://' + validUrl;
    }
    const supported = await Linking.canOpenURL(validUrl);
    if (!supported) {
      Alert.alert('Error', 'Cannot open this website.');
      return;
    }
    await Linking.openURL(validUrl);
  } catch (error) {
    Alert.alert('Error', 'Unable to open website.');
  }
}

export async function shareMarket(marketName: string, address: string, hours?: string) {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { Share } = await import('react-native');
    let message = `${marketName}\n${address}`;
    if (hours) message += `\nHours: ${hours}`;
    await Share.share({ message });
  } catch (error) {
    Alert.alert('Error', 'Unable to share market info.');
  }
} 