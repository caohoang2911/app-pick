import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, Linking, Platform } from 'react-native';
import { DeepLinkPath, generateDeepLink, generateWebDeepLink } from '../core/utils/deepLink';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { debugDeepLinkSetup, testDeepLink } from '../core/utils/deepLinkDev';

// Test data for deep links
const TEST_ORDER_CODE = 'OLCBAA37E5';
const TEST_DELIVERY_CODE = 'OLCBAA37E5';

const DeepLinkTestScreen = () => {
  useEffect(() => {
    // Print debug info on component mount
    debugDeepLinkSetup();
  }, []);

  const openLink = async (url: string) => {
    console.log('Opening URL:', url);
    try {
      const canOpen = await Linking.canOpenURL(url);

      if (canOpen) {
        await Linking.openURL(url);
      } else {
        alert(`Cannot open URL: ${url}\n\nThis indicates the scheme may not be registered correctly. Check console for more information.`);
        if (url.startsWith('apppickdev://')) {
          console.error('The apppickdev:// scheme could not be opened. This might indicate it\'s not properly registered in the app configuration.');
        }
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      alert('An error occurred when trying to open the URL');
    }
  };

  const renderLinkTest = (title: string, url: string) => (
    <View style={styles.linkItem}>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => openLink(url)}
      >
        <Text style={styles.buttonText}>{title}</Text>
      </TouchableOpacity>
      <Text style={styles.urlText}>{url}</Text>
    </View>
  );

  const runTestDeepLink = () => {
    // Test direct debugging of URLs
    testDeepLink('order-detail', { orderCode: TEST_ORDER_CODE });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen 
        options={{
          title: 'Deep Link Test',
        }}
      />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Deep Link Testing (Dev Build)</Text>
          <Text style={styles.subtitle}>
            Tap on the buttons to test opening deep links
          </Text>
          <TouchableOpacity 
            style={[styles.button, { marginTop: 10, backgroundColor: '#FF5722' }]} 
            onPress={runTestDeepLink}
          >
            <Text style={styles.buttonText}>Run Deep Link Debug</Text>
          </TouchableOpacity>
          
          <Text style={styles.devInfo}>
            Build: {Platform.OS === 'ios' ? 'iOS Dev' : 'Android Dev'}{'\n'}
            Scheme: apppickdev{'\n'}
            Bundle ID: {Platform.OS === 'ios' ? 'com.caohoang2911.seedcom-app-pick-dev' : 'com.caohoang2911.AppPickDev'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Links (apppickdev://)</Text>
          
          {renderLinkTest(
            'Order Detail', 
            generateDeepLink(DeepLinkPath.ORDER_DETAIL, { orderCode: TEST_ORDER_CODE })
          )}
          
          {renderLinkTest(
            'Order Invoice', 
            generateDeepLink(DeepLinkPath.ORDER_INVOICE, { orderCode: TEST_ORDER_CODE })
          )}
          
          {renderLinkTest(
            'Scan to Delivery', 
            generateDeepLink(DeepLinkPath.SCAN_TO_DELIVERY, { deliveryCode: TEST_DELIVERY_CODE })
          )}
          
          {renderLinkTest(
            'Orders List', 
            generateDeepLink(DeepLinkPath.ORDERS, {})
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Web Links (Universal/App Links)</Text>
          
          {renderLinkTest(
            'Order Detail (Web)', 
            generateWebDeepLink(DeepLinkPath.ORDER_DETAIL, { orderCode: TEST_ORDER_CODE })
          )}
          
          {renderLinkTest(
            'Order Invoice (Web)', 
            generateWebDeepLink(DeepLinkPath.ORDER_INVOICE, { orderCode: TEST_ORDER_CODE })
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Use in Other Apps</Text>
          <Text style={styles.codeExample}>
{`// In React Native
import { Linking } from 'react-native';

// Open App Pick with order detail:
const openAppPick = async () => {
  const url = 'apppickdev://oms.seedcom.vn/order-detail?orderCode=123456';
  
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  } else {
    // App not installed, open web URL instead
    Linking.openURL('https://oms.seedcom.vn/order-detail?orderCode=123456');
  }
};`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  linkItem: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 12,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  urlText: {
    fontSize: 12,
    color: '#666',
  },
  codeExample: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 6,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
  },
  devInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
});

export default DeepLinkTestScreen; 