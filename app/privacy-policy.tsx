import { useTheme } from '@/context/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PrivacyPolicyScreen() {
  const { isDark } = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color={isDark ? '#FFFFFF' : '#121212'} 
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]}>
          Privacy Policy
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.privacyText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
          This Privacy Policy describes how Your Khata ("we," "us," or "our") collects, uses, and shares your personal information when you use our mobile application ("App").
        </Text>
        
        <Text style={[styles.privacySubtitle, isDark ? styles.textDark : styles.textLight]}>Information We Collect</Text>
        <Text style={[styles.privacyText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
          • Personal Information: Name, phone number, and profile information you provide{'\n'}
          • Transaction Data: Details of money borrowed and lent{'\n'}
          • Device Information: Basic device information for app functionality{'\n'}
          • Usage Data: How you interact with the app
        </Text>
        
        <Text style={[styles.privacySubtitle, isDark ? styles.textDark : styles.textLight]}>How We Use Your Information</Text>
        <Text style={[styles.privacyText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
          • To provide and maintain the App{'\n'}
          • To manage your account and transactions{'\n'}
          • To improve our services{'\n'}
          • To communicate with you about updates
        </Text>
        
        <Text style={[styles.privacySubtitle, isDark ? styles.textDark : styles.textLight]}>Data Storage</Text>
        <Text style={[styles.privacyText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
          All your data is stored locally on your device. We do not store any information on external servers.
        </Text>
        
        <Text style={[styles.privacySubtitle, isDark ? styles.textDark : styles.textLight]}>Security</Text>
        <Text style={[styles.privacyText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
          We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure.
        </Text>
        
        <Text style={[styles.privacySubtitle, isDark ? styles.textDark : styles.textLight]}>Your Rights</Text>
        <Text style={[styles.privacyText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
          You have the right to:{'\n'}
          • Access your personal information{'\n'}
          • Correct inaccurate data{'\n'}
          • Delete your data{'\n'}
          • Export your data
        </Text>
        
        <Text style={[styles.privacySubtitle, isDark ? styles.textDark : styles.textLight]}>Changes to This Policy</Text>
        <Text style={[styles.privacyText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
        </Text>
        
        <Text style={[styles.privacySubtitle, isDark ? styles.textDark : styles.textLight]}>Contact Us</Text>
        <Text style={[styles.privacyText, isDark ? styles.textSubtitleDark : styles.textSubtitleLight]}>
          If you have any questions about this Privacy Policy, please contact us at support@yourkhata.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  lightContainer: {
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textDark: {
    color: '#FFFFFF',
  },
  textLight: {
    color: '#121212',
  },
  textSubtitleDark: {
    color: '#AAAAAA',
  },
  textSubtitleLight: {
    color: '#777777',
  },
  privacySubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  privacyText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
}); 