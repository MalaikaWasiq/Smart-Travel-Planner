import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
  TextInput, Pressable as TouchableOpacity, View,
} from 'react-native';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import AppIcon from '../components/AppIcon';
import { apiRequest } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, radius, spacing } from '../theme';

const starterPrompts = [
  'Summarize my trip history',
  'Compare my trip budgets',
  'Show my recorded expenses',
  'Show active alerts',
];

export default function ChatScreen({ navigation, route }) {
  const { token, currentTrip, trips } = useApp();
  const [session, setSession] = useState(route.params?.session || null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(!route.params?.session);

  useEffect(() => {
    if (session) return;
    (async () => {
      try {
        const data = await apiRequest('/chat', {
          method: 'POST',
          token,
          body: { tripId: currentTrip?._id },
        });
        setSession(data.session);
      } catch (error) {
        Alert.alert('Chat unavailable', error.message);
        navigation.goBack();
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function send(value = input) {
    const message = String(value).trim();
    if (!message || !session || loading) return;
    setInput('');
    setLoading(true);
    setSession((current) => ({
      ...current,
      messages: [...(current.messages || []), { _id: `local-${Date.now()}`, role: 'user', content: message }],
    }));
    try {
      const data = await apiRequest(`/chat/${session._id}/messages`, {
        method: 'POST',
        token,
        body: { message },
      });
      setSession(data.session);
    } catch (error) {
      Alert.alert('Could not send', error.message);
    } finally {
      setLoading(false);
    }
  }

  const messages = session?.messages || [];
  const quickPrompts = messages.at(-1)?.suggestedActions || starterPrompts;
  const contextTrip = trips.find((trip) => String(trip._id) === String(session?.tripId)) || currentTrip;

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader
        title="Travel assistant"
        subtitle={contextTrip ? `All saved data, active trip: ${contextTrip.destination}` : 'All saved trips, budgets, expenses, and alerts'}
        onBack={() => navigation.goBack()}
      />
      {booting ? <ActivityIndicator color={colors.forest} style={{ flex: 1 }} /> : (
        <>
          <ScrollView contentContainerStyle={styles.messages}>
            {!messages.length ? (
              <View style={styles.intro}>
                <View style={styles.introIcon}><AppIcon name="sparkles" color={colors.forest} size={22} /></View>
                <View style={styles.introCopy}>
                  <AppText variant="heading">Your account-aware assistant</AppText>
                  <AppText color={colors.muted}>
                    Ask about trip history, itineraries, budgets, actual expenses, hotels, routes, weather,
                    preferences, or active alerts. Access is read-only, so changes still require confirmation in the app.
                  </AppText>
                </View>
              </View>
            ) : null}
            {messages.map((item, index) => (
              <View key={item._id || index} style={[styles.bubble, item.role === 'user' ? styles.user : styles.bot]}>
                <MarkdownText compact color={item.role === 'user' ? colors.white : colors.ink}>{item.content}</MarkdownText>
                {item.fallbackUsed ? <AppText variant="caption" color={colors.muted}>Deterministic fallback answer</AppText> : null}
              </View>
            ))}
            {loading ? <ActivityIndicator color={colors.forest} /> : null}
          </ScrollView>
          <View style={styles.quick}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickPrompts.map((prompt) => (
                <TouchableOpacity key={prompt} style={styles.quickChip} onPress={() => send(prompt)} disabled={loading}>
                  <AppText variant="caption" color={colors.forest}>{prompt}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.composer}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your planner data"
              multiline
              maxLength={1000}
              onSubmitEditing={() => send()}
            />
            <TouchableOpacity accessibilityLabel="Send message" style={styles.send} onPress={() => send()} disabled={loading}>
              <AppIcon name="send" color={colors.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  messages: { width: '100%', maxWidth: 900, alignSelf: 'center', padding: spacing.lg, gap: 10, flexGrow: 1 },
  intro: { backgroundColor: colors.paper, padding: 20, borderRadius: radius.lg, gap: 12, flexDirection: 'row', borderWidth: 1, borderColor: colors.line },
  introIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1, gap: 5 },
  bubble: { maxWidth: 760, padding: 12, borderRadius: radius.lg, gap: 5 },
  user: { alignSelf: 'flex-end', backgroundColor: colors.forest, borderBottomRightRadius: 4 },
  bot: { alignSelf: 'flex-start', backgroundColor: colors.paper, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.line },
  quick: { paddingHorizontal: 12, paddingVertical: 7, borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.cream },
  quickChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.green, borderRadius: radius.pill, marginRight: 7, backgroundColor: colors.paper },
  composer: { width: '100%', maxWidth: 900, alignSelf: 'center', flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 8, backgroundColor: colors.paper },
  input: { flex: 1, maxHeight: 110, minHeight: 46, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 11, color: colors.ink },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
});
