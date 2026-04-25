// Chat Screen – Gemini AI health chatbot
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { sendChatMessage } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';

// ── Initial greeting message ─────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    id: '0',
    role: 'model',
    text: "Hello! I'm lifeOnLine, your personal health assistant.\n\nI can help you with symptoms, medications, first aid, and health guidance. How are you feeling today?",
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  },
];

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const flatRef = useRef(null);

  const buildHistory = (msgs) =>
    msgs
      .filter((m) => m.id !== '0')
      .map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }));

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = buildHistory(messages);
      const res = await sendChatMessage(text, history);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: res.data.reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const reason = err?.userMessage || err?.response?.data?.error || err?.message || 'Network error';
      const errMsg = {
        id: (Date.now() + 2).toString(),
        role: 'model',
        text: `Unable to connect. ${reason}. For emergencies, please press the SOS button or call 108.`,
        error: reason,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  // Render **bold** markdown inline within a Text node
  const parseBold = (text, baseStyle, boldColor) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <Text style={baseStyle}>
        {parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <Text key={i} style={{ fontWeight: '700', color: boldColor || undefined }}>
                {part.slice(2, -2)}
              </Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const baseStyle = [styles.bubbleText, isUser && styles.bubbleTextUser];
    // For user bubbles keep white bold; for AI bubbles make bold slightly darker
    const boldColor = isUser ? '#fff' : COLORS.textPrimary;
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AI</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI, item.isError && styles.bubbleError]}>
          {parseBold(item.text, baseStyle, boldColor)}
          <Text style={[styles.timestamp, isUser && styles.timestampUser]}>{item.time}</Text>
        </View>
      </View>
    );
  };

  const quickReplies = ['I have a headache', 'Chest pain', 'I feel dizzy', 'First aid help'];

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={
          loading ? (
            <View style={styles.typing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>AI</Text>
              </View>
              <View style={styles.typingBubble}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.typingText}>Thinking...</Text>
              </View>
            </View>
          ) : null
        }
      />

      {messages.length <= 2 && (
        <View style={styles.quickRow}>
          {quickReplies.map((q) => (
            <TouchableOpacity
              key={q}
              style={styles.chip}
              onPress={() => { setInput(q); }}
            >
              <Text style={styles.chipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Describe your symptoms..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendIcon}>{'\u25B6'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.md, paddingBottom: SPACING.lg },

  msgRow: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end' },
  msgRowUser: { flexDirection: 'row-reverse' },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: SPACING.xs,
  },
  avatarText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  bubble: {
    maxWidth: '78%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
    ...SHADOWS.card,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: 4,
    borderColor: COLORS.primaryDark,
  },
  bubbleError: { borderColor: COLORS.danger + '40', backgroundColor: '#FFF5F5' },

  bubbleText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, lineHeight: 22 },
  bubbleTextUser: { color: '#fff' },

  timestamp: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 4, textAlign: 'right' },
  timestampUser: { color: 'rgba(255,255,255,0.65)' },

  typing: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginLeft: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typingText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },

  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.accentSurface,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.accentLight + '40',
  },
  chipText: { color: COLORS.accentLight, fontSize: FONTS.sizes.sm, fontWeight: '500' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  sendBtnDisabled: { backgroundColor: COLORS.surfaceLight, opacity: 0.5 },
  sendIcon: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
