import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const destinations = [
  { href: '/update-arabic', label: 'Update Arabic Reading' },
  { href: '/update-bangla', label: 'Update Bangla Reading' },
  { href: '/history', label: 'View History' },
  { href: '/settings', label: 'Settings' },
] as const;

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quran Reading Tracker</Text>
      <Text style={styles.subtitle}>
        Placeholder home screen. Reading progress for both tracks will be
        displayed here in a later phase.
      </Text>
      <View style={styles.linkList}>
        {destinations.map((destination) => (
          <Link key={destination.href} href={destination.href} asChild>
            <Pressable style={styles.link}>
              <Text style={styles.linkLabel}>{destination.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
  },
  linkList: {
    alignSelf: 'stretch',
    gap: 12,
  },
  link: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#208AEF',
  },
  linkLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
