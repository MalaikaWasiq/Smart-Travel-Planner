import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable as TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ScreenHeader from '../components/ScreenHeader';
import AppText from '../components/AppText';
import MarkdownText from '../components/MarkdownText';
import AppIcon from '../components/AppIcon';
import { apiRequest } from '../api/client';
import { useApp } from '../context/AppContext';
import { colors, fonts, radius, shadow, shadowSoft, spacing } from '../theme';
import destinationsCatalog from '../data/pakistanDestinations.json';

const STARTER_PROMPTS = [
  'Explore Pakistan',
  'Find peaceful destinations',
  'Travel safety tips',
  'Best time to visit Northern Areas',
  'Family travel suggestions',
  'Learn about Pakistani culture',
];

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (_) {
    return '';
  }
}

function DestinationRecommendationCard({ destination, navigation }) {
  if (!destination) return null;

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() => navigation.navigate('DestinationDetail', { destination })}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${destination.name}`}
    >
      <Image
        source={{
          uri:
            destination.imageUrl ||
            'https://images.unsplash.com/photo-1588714477688-cf28a50e94f7?w=600&q=80',
        }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <AppText style={styles.cardTitle} numberOfLines={1}>
            {destination.name}
          </AppText>
          {destination.rating ? (
            <View style={styles.ratingBadge}>
              <AppIcon name="star" size={11} color="#f59e0b" />
              <AppText style={styles.ratingText}>
                {Number(destination.rating).toFixed(1)}
              </AppText>
            </View>
          ) : null}
        </View>

        <AppText style={styles.cardSubtitle} numberOfLines={1}>
          {destination.region ? `${destination.region} • ` : ''}
          {destination.category || 'Must-visit spot'}
        </AppText>

        {destination.bestTimeToVisit ? (
          <AppText style={styles.cardMeta} numberOfLines={1}>
            🗓️ {destination.bestTimeToVisit}
          </AppText>
        ) : null}

        <View style={styles.cardActionRow}>
          <AppText style={styles.cardActionText}>Explore Destination</AppText>
          <AppIcon name="arrow-forward" size={13} color="#0c3d26" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ChatScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 768;

  const { token, currentTrip, trips } = useApp();
  const [session, setSession] = useState(route.params?.session || null);
  const [messages, setMessages] = useState(route.params?.session?.messages || []);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  // ChatGPT-style Side Panel States
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktop);
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollViewRef = useRef(null);
  const inputRef = useRef(null);
  const isSendingRef = useRef(false);

  // Auto-adapt sidebar on desktop resize
  useEffect(() => {
    if (isDesktop) {
      setIsSidebarOpen(true);
    }
  }, [isDesktop]);

  // If a session was passed via route params, sync messages
  useEffect(() => {
    if (route.params?.session) {
      setMessages(route.params.session.messages || []);
      setSession(route.params.session);
    }
  }, [route.params?.session]);

  // Load chat sessions from backend & local cache
  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      // 1. Load from cache first for instant UI response
      const cached = await AsyncStorage.getItem('cached_chat_sessions');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSessions(parsed);
          }
        } catch (_) {}
      }

      // 2. Load latest from API if authenticated
      if (token) {
        const res = await apiRequest('/chat', { token });
        if (Array.isArray(res.sessions)) {
          setSessions(res.sessions);
          await AsyncStorage.setItem('cached_chat_sessions', JSON.stringify(res.sessions));
        }
      }
    } catch (e) {
      console.warn('Could not load chat sessions:', e?.message || e);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Start fresh new chat (like ChatGPT "+ New Chat")
  const handleResetChat = () => {
    setMessages([]);
    setSession(null);
    setErrorMsg(null);
    setLastFailedMessage(null);
    setInput('');
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  // Select an existing conversation from history
  const handleSelectSession = async (sessionItem) => {
    try {
      setLoading(false);
      setErrorMsg(null);
      setLastFailedMessage(null);

      let fullSession = sessionItem;
      // If messages array isn't populated, fetch detail from API
      if (token && sessionItem._id && (!sessionItem.messages || sessionItem.messages.length === 0)) {
        try {
          const res = await apiRequest(`/chat/${sessionItem._id}`, { token });
          if (res.session) fullSession = res.session;
        } catch (_) {}
      }

      setSession(fullSession);
      setMessages(fullSession.messages || []);
      if (!isDesktop) {
        setIsSidebarOpen(false);
      }
      scrollToBottom();
    } catch (e) {
      setErrorMsg('Could not open conversation.');
    }
  };

  // Delete a conversation from history
  const handleDeleteSession = async (sessionId, sessionTitle) => {
    const doDelete = async () => {
      try {
        if (token) {
          await apiRequest(`/chat/${sessionId}`, { method: 'DELETE', token });
        }
        setSessions((prev) => {
          const next = prev.filter((item) => item._id !== sessionId);
          AsyncStorage.setItem('cached_chat_sessions', JSON.stringify(next)).catch(() => {});
          return next;
        });

        if (session?._id === sessionId) {
          handleResetChat();
        }
      } catch (err) {
        if (Platform.OS === 'web') {
          window.alert(err.message || 'Could not delete conversation.');
        } else {
          Alert.alert('Error', err.message || 'Could not delete conversation.');
        }
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete conversation "${sessionTitle || 'this chat'}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Delete Chat',
        `Delete conversation "${sessionTitle || 'this chat'}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  async function send(value) {
    const messageToSend = typeof value === 'string' ? value : input;
    const rawMessage = String(messageToSend || '').trim();
    if (!rawMessage || loading || isSendingRef.current) return;

    isSendingRef.current = true;
    setInput('');
    setErrorMsg(null);
    setLastFailedMessage(null);

    const userMsg = {
      _id: `user-${Date.now()}`,
      role: 'user',
      content: rawMessage,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);
    scrollToBottom();

    try {
      // Build conversation payload for backend
      const conversationPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiRequest('/chat', {
        method: 'POST',
        token,
        body: {
          message: rawMessage,
          conversation: conversationPayload,
          sessionId: session?._id || undefined,
          context: {
            tripId: currentTrip?._id || undefined,
            destination: currentTrip?.destination || undefined,
          },
        },
      });

      const replyContent =
        res.reply ||
        res.content ||
        res.message?.content ||
        (Array.isArray(res.session?.messages) && res.session.messages.length > 0
          ? res.session.messages[res.session.messages.length - 1]?.content
          : null) ||
        (rawMessage.toLowerCase().includes('peace') || rawMessage.toLowerCase().includes('sukoon')
          ? `### 🌿 Peaceful & Tranquil Destinations in Pakistan\n\nIf you are looking to unwind, escape city noise, and immerse yourself in serenity, here are top tranquil destinations in Pakistan:\n\n1. **Hunza Valley (Gilgit-Baltistan)**: Crisp mountain air, breathtaking views of Rakaposhi, and tranquil apricot blossoms in Karimabad and Gulmit.\n   * **Best Time:** April to October\n   * **Vibe:** Mountain peace, hospitable culture, and scenic tranquility.\n\n2. **Neelum Valley (Azad Kashmir)**: Crystalline roaring rivers, dense pine forests, and quiet alpine meadows in Sharda and Arang Kel.\n   * **Best Time:** May to October\n   * **Vibe:** Lush greenery, riverside retreats, and cool fresh breezes.\n\n3. **Kumrat Valley (Upper Dir, KPK)**: Untouched alpine wilderness with towering deodar pines, quiet crystal rivers, and secluded riverside campsites.\n   * **Best Time:** May to September\n   * **Vibe:** Pristine nature, quiet trails, and wilderness calm.\n\n4. **Kund Malir & Hingol (Balochistan Coast)**: Golden sand beaches beside dramatic coastal cliffs with clean Arabian Sea waves and tranquil stargazing.\n   * **Best Time:** October to March\n   * **Vibe:** Peaceful coastline, quiet waves, and starry skies.\n\n*Travel Tip: Travel during mid-week to avoid weekend crowds, pack comfortable walking shoes and warm layers for mountain evenings.*`
          : `### 🌄 Welcome to SafarSaathi AI – Your Pakistan Travel Guide\n\nPakistan is home to world-renowned mountains, historic heritage cities, and stunning coastlines:\n\n* **Northern Wonders**: Hunza, Skardu, Fairy Meadows, Naran-Kaghan, and Swat Valley.\n* **Cultural Heritage**: Lahore Fort, Badshahi Mosque, Rohtas Fort, and Taxila ruins.\n* **Coastal Escapes**: Gwadar, Kund Malir Beach, and Astola Island.\n\nFeel free to ask about any destination, best season to visit, packing tips, routes, or local culture!`);

      // Ensure destination cards always appear underneath whenever destinations are mentioned
      let recommendedDestinations =
        res.recommendedDestinations || res.message?.recommendedDestinations || [];

      if (!recommendedDestinations || recommendedDestinations.length === 0) {
        const textToCheck = `${rawMessage} ${replyContent}`.toLowerCase();
        const matched = [];
        for (const dest of destinationsCatalog) {
          const nameLower = dest.name.toLowerCase();
          const idLower = (dest.destinationId || dest.id || '').toLowerCase();
          if (
            textToCheck.includes(nameLower) ||
            (idLower.length > 3 && textToCheck.includes(idLower))
          ) {
            matched.push(dest);
            if (matched.length >= 4) break;
          }
        }
        if (matched.length > 0) {
          recommendedDestinations = matched;
        }
      }

      const assistantMsg = {
        _id: `bot-${Date.now()}`,
        role: 'assistant',
        content: replyContent,
        recommendedDestinations,
        suggestedActions:
          res.suggestedActions || res.message?.suggestedActions || [],
        model: res.model || res.message?.model,
        fallbackUsed: res.fallbackUsed || res.message?.fallbackUsed,
        createdAt: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);

      if (res.session) {
        setSession(res.session);
        setSessions((prev) => {
          const exists = prev.some((s) => s._id === res.session._id);
          let updated;
          if (exists) {
            updated = prev.map((s) => (s._id === res.session._id ? res.session : s));
          } else {
            updated = [res.session, ...prev];
          }
          AsyncStorage.setItem('cached_chat_sessions', JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      } else {
        // Fallback for guest mode / local state
        const localSessionId = session?._id || `local-${Date.now()}`;
        const localTitle = session?.title || (rawMessage.length > 45 ? `${rawMessage.slice(0, 42)}...` : rawMessage);
        const newLocalSession = {
          _id: localSessionId,
          title: localTitle,
          messages: finalMessages,
          updatedAt: new Date().toISOString(),
          createdAt: session?.createdAt || new Date().toISOString(),
        };
        setSession(newLocalSession);
        setSessions((prev) => {
          const filtered = prev.filter((s) => s._id !== localSessionId);
          const nextList = [newLocalSession, ...filtered];
          AsyncStorage.setItem('cached_chat_sessions', JSON.stringify(nextList)).catch(() => {});
          return nextList;
        });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Could not connect to SafarSaathi AI.');
      setLastFailedMessage(rawMessage);
    } finally {
      isSendingRef.current = false;
      setLoading(false);
      scrollToBottom();
      if (Platform.OS === 'web') {
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
  }

  // Filter sessions by search query
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase().trim();
    return sessions.filter((s) => {
      const titleMatch = s.title && s.title.toLowerCase().includes(q);
      const msgMatch = Array.isArray(s.messages) && s.messages.some((m) => m.content && m.content.toLowerCase().includes(q));
      return titleMatch || msgMatch;
    });
  }, [sessions, searchQuery]);

  // Group filtered sessions chronologically like ChatGPT
  const groupedSessions = useMemo(() => {
    const groups = [
      { title: 'Today', items: [] },
      { title: 'Yesterday', items: [] },
      { title: 'Previous 7 Days', items: [] },
      { title: 'Older', items: [] },
    ];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOf7Days = startOfToday - 6 * 86400000;

    filteredSessions.forEach((s) => {
      const time = new Date(s.updatedAt || s.createdAt || Date.now()).getTime();
      if (time >= startOfToday) {
        groups[0].items.push(s);
      } else if (time >= startOfYesterday) {
        groups[1].items.push(s);
      } else if (time >= startOf7Days) {
        groups[2].items.push(s);
      } else {
        groups[3].items.push(s);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredSessions]);

  const latestMessage = messages.at(-1);
  const activeSuggestions =
    latestMessage?.suggestedActions && latestMessage.suggestedActions.length > 0
      ? latestMessage.suggestedActions
      : STARTER_PROMPTS;

  // Render Sidebar Content (Shared by Desktop and Mobile Drawer)
  const renderSidebarContent = () => (
    <View style={styles.sidebarInner}>
      {/* 1. Sidebar Header */}
      <View style={styles.sidebarHeaderRow}>
        <View style={styles.sidebarHeaderTitleRow}>
          <AppIcon name="time-outline" size={19} color="#174f36" />
          <AppText style={styles.sidebarTitleText}>Chat History</AppText>
          <View style={styles.sidebarBadge}>
            <AppText style={styles.sidebarBadgeText}>{filteredSessions.length}</AppText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.sidebarCloseBtn}
          onPress={() => setIsSidebarOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Close History Panel"
        >
          <AppIcon
            name={isDesktop ? "chevron-back" : "close"}
            size={20}
            color="#64748b"
          />
        </TouchableOpacity>
      </View>

      {/* 2. + New Chat Action Button */}
      <View style={styles.sidebarActionWrap}>
        <TouchableOpacity
          style={styles.sidebarNewChatBtn}
          onPress={handleResetChat}
          accessibilityRole="button"
          accessibilityLabel="Start a new chat"
        >
          <AppIcon name="add-circle" size={18} color="#ffffff" />
          <AppText style={styles.sidebarNewChatText}>+ New Chat</AppText>
        </TouchableOpacity>
      </View>

      {/* 3. Search History Bar (Search in previous conversations) */}
      <View style={styles.sidebarSearchWrap}>
        <View style={styles.sidebarSearchBox}>
          <AppIcon name="search-outline" size={15} color="#64748b" />
          <TextInput
            style={styles.sidebarSearchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor="#94a3b8"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <AppIcon name="close-circle" size={15} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 4. Previous Chats Chronological List */}
      <ScrollView
        style={styles.sidebarScroll}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {sessionsLoading ? (
          <View style={styles.sidebarLoadingBox}>
            <ActivityIndicator size="small" color="#174f36" />
            <AppText style={styles.sidebarLoadingText}>Loading chat history...</AppText>
          </View>
        ) : groupedSessions.length > 0 ? (
          groupedSessions.map((group) => (
            <View key={group.title} style={styles.groupSection}>
              <AppText style={styles.groupHeader}>{group.title}</AppText>
              {group.items.map((item) => {
                const isActive = session?._id === item._id;
                return (
                  <View
                    key={item._id}
                    style={[
                      styles.sessionCard,
                      isActive && styles.sessionCardActive,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.sessionMainPressable}
                      onPress={() => handleSelectSession(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Open conversation: ${item.title}`}
                    >
                      <View
                        style={[
                          styles.sessionIconCircle,
                          isActive && styles.sessionIconCircleActive,
                        ]}
                      >
                        <AppIcon
                          name={isActive ? 'sparkles' : 'chatbubble-ellipses-outline'}
                          size={14}
                          color={isActive ? '#15803d' : '#64748b'}
                        />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText
                          style={[
                            styles.sessionTitle,
                            isActive && styles.sessionTitleActive,
                          ]}
                          numberOfLines={1}
                        >
                          {item.title || 'Untitled Chat'}
                        </AppText>
                        <AppText style={styles.sessionMetaText} numberOfLines={1}>
                          {formatRelativeTime(item.updatedAt || item.createdAt)} • {item.messages?.length || 0} messages
                        </AppText>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.sessionDeleteBtn}
                      onPress={() => handleDeleteSession(item._id, item.title)}
                      accessibilityRole="button"
                      accessibilityLabel="Delete chat"
                    >
                      <AppIcon name="trash-outline" size={15} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))
        ) : (
          <View style={styles.sidebarEmptyBox}>
            <AppIcon name="chatbubbles-outline" size={36} color="#94a3b8" />
            <AppText style={styles.sidebarEmptyTitle}>
              {searchQuery ? 'No conversations found' : 'No chat history yet'}
            </AppText>
            <AppText style={styles.sidebarEmptyDesc}>
              {searchQuery
                ? `No chats matched "${searchQuery}". Try a different keyword.`
                : 'Your conversations with SafarSaathi AI will appear here automatically.'}
            </AppText>
            {searchQuery ? (
              <TouchableOpacity
                style={styles.clearFilterBtn}
                onPress={() => setSearchQuery('')}
              >
                <AppText style={styles.clearFilterBtnText}>Clear Search</AppText>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Navigation Header with Toggle History & New Chat Buttons */}
      <ScreenHeader
        title="SafarSaathi AI"
        subtitle="Your Smart Travel & Tourism Companion"
        onBack={() => navigation.goBack()}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity
            style={[styles.hamburgerMenuBtn, isSidebarOpen && styles.hamburgerMenuBtnActive]}
            onPress={() => setIsSidebarOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel="Toggle Chat History and Search Sidebar"
            activeOpacity={0.75}
          >
            <AppIcon name="menu" size={24} color="#ffffff" />
            <AppText style={styles.hamburgerMenuText}>
              {isSidebarOpen ? 'Hide Sidebar' : 'Open Sidebar'}
            </AppText>
            {sessions.length > 0 && (
              <View style={styles.hamburgerBadge}>
                <AppText style={styles.hamburgerBadgeText}>{sessions.length}</AppText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScreenHeader>

      {/* Main Two-Column Layout (Sidebar + Chat Area) */}
      <View style={styles.mainLayout}>
        {/* Desktop Side Panel (Inline Column) */}
        {isDesktop && isSidebarOpen ? (
          <View style={styles.desktopSidebar}>
            {renderSidebarContent()}
          </View>
        ) : null}

        {/* Mobile Slide-in Drawer with Backdrop */}
        {!isDesktop && isSidebarOpen ? (
          <>
            <TouchableOpacity
              style={styles.mobileDrawerBackdrop}
              activeOpacity={1}
              onPress={() => setIsSidebarOpen(false)}
            />
            <View style={styles.mobileDrawer}>
              {renderSidebarContent()}
            </View>
          </>
        ) : null}

        {/* Main Chat Conversation Column */}
        <View style={styles.chatArea}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View style={styles.introCard}>
                <View style={styles.introHeader}>
                  <View style={styles.introIconCircle}>
                    <AppIcon name="sparkles" color="#0c3d26" size={24} />
                  </View>
                  <View style={styles.introHeaderText}>
                    <AppText style={styles.introGreeting}>Assalam-o-Alaikum! 🌄</AppText>
                    <AppText style={styles.introTagline}>
                      I am SafarSaathi AI, your personal travel companion.
                    </AppText>
                  </View>
                </View>

                <AppText style={styles.introBody}>
                  Ask me anything about Pakistan's breathtaking mountains, serene beaches,
                  heritage landmarks, local food, best seasons to visit, packing essentials,
                  or mountain travel safety.
                </AppText>

                <View style={styles.langPill}>
                  <AppIcon name="chatbubbles" size={14} color="#059669" />
                  <AppText style={styles.langText}>
                    English & Roman Urdu naturally supported
                  </AppText>
                </View>

                <View style={styles.starterSection}>
                  <AppText style={styles.starterHeading}>Popular Topics to Explore:</AppText>
                  <View style={styles.starterGrid}>
                    {STARTER_PROMPTS.map((prompt) => (
                      <TouchableOpacity
                        key={prompt}
                        style={styles.starterChip}
                        onPress={() => send(prompt)}
                        disabled={loading}
                        accessibilityRole="button"
                        accessibilityLabel={prompt}
                      >
                        <AppText style={styles.starterChipText}>{prompt}</AppText>
                        <AppIcon name="arrow-forward" size={13} color="#0c3d26" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            ) : null}

            {messages.map((item, index) => {
              const isUser = item.role === 'user';
              const recs = item.recommendedDestinations || [];

              return (
                <View
                  key={item._id || index}
                  style={[
                    styles.bubbleWrapper,
                    isUser ? styles.bubbleWrapperUser : styles.bubbleWrapperBot,
                  ]}
                >
                  {!isUser ? (
                    <View style={styles.botAvatar}>
                      <AppIcon name="sparkles" size={15} color="#0c3d26" />
                    </View>
                  ) : null}

                  <View
                    style={[
                      styles.bubble,
                      isUser ? styles.userBubble : styles.botBubble,
                    ]}
                  >
                    {!isUser ? (
                      <View style={styles.botBadgeRow}>
                        <AppText style={styles.botNameBadge}>SafarSaathi AI</AppText>
                      </View>
                    ) : null}

                    <MarkdownText
                      compact
                      color={isUser ? colors.white : colors.ink}
                    >
                      {item.content}
                    </MarkdownText>

                    {/* Render Recommendation Cards if AI suggested catalog destinations */}
                    {recs.length > 0 ? (
                      <View style={styles.recommendationsSection}>
                        <AppText style={styles.recommendationsTitle}>
                          Featured Destinations to Explore:
                        </AppText>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.recommendationsScroll}
                        >
                          {recs.map((dest, i) => (
                            <DestinationRecommendationCard
                              key={dest.destinationId || dest.id || i}
                              destination={dest}
                              navigation={navigation}
                            />
                          ))}
                        </ScrollView>
                      </View>
                    ) : null}

                    {item.fallbackUsed ? (
                      <View style={styles.noticeRow}>
                        <AppIcon name="information-circle-outline" size={12} color={colors.muted} />
                        <AppText variant="caption" color={colors.muted}>
                          SafarSaathi AI Notice
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}

            {loading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.botAvatar}>
                  <AppIcon name="sparkles" size={15} color="#0c3d26" />
                </View>
                <View style={styles.loadingBubble}>
                  <ActivityIndicator size="small" color="#0c3d26" />
                  <AppText style={styles.loadingText}>
                    SafarSaathi AI is thinking...
                  </AppText>
                </View>
              </View>
            ) : null}

            {errorMsg ? (
              <View style={styles.errorBanner}>
                <AppIcon name="alert-circle" size={18} color="#dc2626" />
                <AppText style={styles.errorText}>{errorMsg}</AppText>
                {lastFailedMessage ? (
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => send(lastFailedMessage)}
                  >
                    <AppText style={styles.retryButtonText}>Retry</AppText>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}
          </ScrollView>

          {/* Suggested Quick Prompt Chips */}
          <View style={styles.quickBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickScroll}
            >
              {activeSuggestions.map((prompt) => (
                <TouchableOpacity
                  key={prompt}
                  style={styles.quickChip}
                  onPress={() => send(prompt)}
                  disabled={loading}
                  accessibilityRole="button"
                >
                  <AppText style={styles.quickChipText}>{prompt}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Message Composer */}
          <View style={styles.composerWrapper}>
            <View style={styles.composer}>
              <TextInput
                ref={inputRef}
                id="chat-message-input"
                nativeID="chat-message-input"
                name="chatMessage"
                accessibilityLabel="Chat Message Input"
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask about places, seasons, culture, routes..."
                placeholderTextColor="#9ca3af"
                multiline={true}
                blurOnSubmit={false}
                returnKeyType="send"
                maxLength={1000}
                onKeyPress={(e) => {
                  const key = e.nativeEvent?.key || e.key;
                  const shiftKey = Boolean(e.nativeEvent?.shiftKey ?? e.shiftKey);
                  if (key === 'Enter' && !shiftKey) {
                    if (typeof e.preventDefault === 'function') e.preventDefault();
                    if (e.nativeEvent && typeof e.nativeEvent.preventDefault === 'function') {
                      e.nativeEvent.preventDefault();
                    }
                    send();
                  }
                }}
                onSubmitEditing={() => send()}
                editable={!loading}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Send message to SafarSaathi AI"
                style={[styles.sendButton, (loading || !input.trim()) && styles.sendButtonDisabled]}
                onPress={() => send()}
                disabled={loading || !input.trim()}
                activeOpacity={0.7}
              >
                <AppIcon name="send" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#fbf8f2',
  },

  // Header Quick Actions Bar (ChatGPT 3-Lines Hamburger Sidebar Toggle)
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  hamburgerMenuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    alignSelf: 'flex-start',
  },
  hamburgerMenuBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.38)',
    borderColor: '#ffffff',
  },
  hamburgerMenuText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: fonts.bold,
  },
  hamburgerBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 2,
  },
  hamburgerBadgeText: {
    color: '#174f36',
    fontSize: 11,
    fontFamily: fonts.bold,
  },

  // Main Layout
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
    position: 'relative',
    overflow: 'hidden',
  },

  // Desktop Side Panel
  desktopSidebar: {
    width: 310,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
    flexDirection: 'column',
    height: '100%',
  },

  // Mobile Drawer Overlay
  mobileDrawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    zIndex: 900,
  },
  mobileDrawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '84%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    zIndex: 950,
    flexDirection: 'column',
    boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
    elevation: 16,
  },

  // Sidebar Inner Elements
  sidebarInner: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeaderRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sidebarHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sidebarTitleText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: '#0f172a',
  },
  sidebarBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  sidebarBadgeText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#047857',
  },
  sidebarCloseBtn: {
    padding: 6,
    borderRadius: 8,
  },

  // New Chat in Sidebar
  sidebarActionWrap: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  sidebarNewChatBtn: {
    backgroundColor: '#174f36',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#174f36',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  sidebarNewChatText: {
    color: '#ffffff',
    fontFamily: fonts.bold,
    fontSize: 13,
    letterSpacing: 0.2,
  },

  // Search History Input
  sidebarSearchWrap: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  sidebarSearchBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
  },
  sidebarSearchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#0f172a',
    paddingVertical: 0,
    marginLeft: 6,
  },
  clearSearchBtn: {
    padding: 4,
  },

  // Sessions List
  sidebarScroll: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  sidebarLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  sidebarLoadingText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: fonts.medium,
  },
  groupSection: {
    marginBottom: 8,
  },
  groupHeader: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  sessionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 9,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sessionCardActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  sessionMainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 9,
  },
  sessionIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionIconCircleActive: {
    backgroundColor: '#dcfce7',
  },
  sessionTitle: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#1e293b',
  },
  sessionTitleActive: {
    fontFamily: fonts.bold,
    color: '#14532d',
  },
  sessionMetaText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: '#64748b',
    marginTop: 2,
  },
  sessionDeleteBtn: {
    padding: 10,
    opacity: 0.7,
  },
  sidebarEmptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
    gap: 8,
  },
  sidebarEmptyTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: '#475569',
    marginTop: 6,
  },
  sidebarEmptyDesc: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  clearFilterBtn: {
    marginTop: 10,
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  clearFilterBtnText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#0f172a',
  },

  // Chat Area on Right
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fbf8f2',
  },
  scrollContent: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    padding: spacing.md,
    paddingBottom: 24,
    gap: 14,
    flexGrow: 1,
  },

  // Intro Card
  introCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.xl,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...shadowSoft,
    gap: 14,
    marginBottom: 8,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  introIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  introHeaderText: {
    flex: 1,
  },
  introGreeting: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: '#0c3d26',
    lineHeight: 26,
  },
  introTagline: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#059669',
    marginTop: 2,
  },
  introBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    gap: 7,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  langText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#065f46',
  },
  starterSection: {
    marginTop: 6,
    gap: 10,
  },
  starterHeading: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  starterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  starterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4fbf7',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.lg,
    gap: 8,
  },
  starterChipText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#0c3d26',
  },

  // Message Bubbles
  bubbleWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '100%',
  },
  bubbleWrapperUser: {
    justifyContent: 'flex-end',
  },
  bubbleWrapperBot: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  bubble: {
    maxWidth: '88%',
    padding: 14,
    borderRadius: radius.xl,
    gap: 8,
  },
  userBubble: {
    backgroundColor: '#0c3d26',
    borderBottomRightRadius: 4,
    ...shadowSoft,
  },
  botBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    ...shadowSoft,
  },
  botBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  botNameBadge: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#059669',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },

  // Recommendation Cards
  recommendationsSection: {
    marginTop: 10,
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  recommendationsTitle: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: '#0c3d26',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  recommendationsScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  cardContainer: {
    width: 210,
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#d1fae5',
    overflow: 'hidden',
    ...shadowSoft,
  },
  cardImage: {
    width: '100%',
    height: 110,
    backgroundColor: '#e5e7eb',
  },
  cardContent: {
    padding: 10,
    gap: 4,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  cardTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#0c3d26',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  ratingText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: '#92400e',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#059669',
    fontFamily: fonts.medium,
  },
  cardMeta: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#f0fdf4',
  },
  cardActionText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: '#0c3d26',
  },

  // Loading
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: radius.xl,
    borderBottomLeftRadius: 4,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: '#4b5563',
  },

  // Error Banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 12,
    borderRadius: radius.lg,
    gap: 8,
    alignSelf: 'center',
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#991b1b',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: fonts.bold,
  },

  // Quick Chips
  quickBar: {
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
  },
  quickScroll: {
    paddingHorizontal: spacing.md,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#6ee7b7',
    borderRadius: radius.pill,
    backgroundColor: '#f0fdf4',
  },
  quickChipText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: '#065f46',
  },

  // Composer
  composerWrapper: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  composer: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 9,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0c3d26',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: Platform.OS === 'web' ? 'pointer' : undefined,
    ...shadowSoft,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: Platform.OS === 'web' ? 'not-allowed' : undefined,
    opacity: 0.6,
  },
});
