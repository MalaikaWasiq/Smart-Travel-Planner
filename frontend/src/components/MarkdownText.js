import React from 'react';
import { Linking, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radius, spacing, typography } from '../theme';
import { INLINE_MARKDOWN_PATTERN, parseMarkdownBlocks } from '../utils/markdown';

function openSafeLink(url) {
  if (!/^https?:\/\//i.test(url)) return;
  Linking.openURL(url).catch(() => {});
}

function renderInline(content, color, onDark) {
  const parts = String(content || '').split(INLINE_MARKDOWN_PATTERN);
  return parts.filter(Boolean).map((part, index) => {
    const key = `${index}-${part.slice(0, 12)}`;
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (link) {
      return (
        <Text
          key={key}
          accessibilityRole="link"
          onPress={() => openSafeLink(link[2])}
          style={[styles.link, onDark && styles.linkOnDark]}
        >
          {link[1]}
        </Text>
      );
    }
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return <Text key={key} style={styles.bold}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('~~') && part.endsWith('~~')) {
      return <Text key={key} style={styles.strike}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <Text key={key} style={[styles.inlineCode, { color: onDark ? colors.forest : color }]}>{part.slice(1, -1)}</Text>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <Text key={key} style={styles.italic}>{part.slice(1, -1)}</Text>;
    }
    return part;
  });
}

export default function MarkdownText({
  children,
  color = colors.ink,
  compact = false,
  numberOfLines,
  style,
  variant = 'body',
}) {
  const blocks = parseMarkdownBlocks(children);
  const baseStyle = [typography[variant] || typography.body, { color }, style];
  const onDark = color === colors.white || color === colors.mint;

  if (!blocks.length) return null;

  return (
    <View style={[styles.container, compact && styles.compact]}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === 'heading') {
          const headingStyle = block.level === 1 ? typography.title : block.level === 2 ? typography.heading : typography.bodyStrong;
          return <Text key={key} style={[baseStyle, headingStyle, styles.block]}>{renderInline(block.content, color, onDark)}</Text>;
        }
        if (block.type === 'list') {
          return (
            <View key={key} style={styles.list}>
              {block.items.map((item, itemIndex) => (
                <View key={`${key}-${itemIndex}`} style={styles.listRow}>
                  <Text style={[baseStyle, styles.marker, onDark && styles.markerOnDark]}>{block.ordered ? `${item.marker}.` : '\u2022'}</Text>
                  <Text numberOfLines={numberOfLines} style={[baseStyle, styles.listText]}>{renderInline(item.content, color, onDark)}</Text>
                </View>
              ))}
            </View>
          );
        }
        if (block.type === 'quote') {
          return (
            <View key={key} style={[styles.quote, onDark && styles.quoteOnDark]}>
              <Text numberOfLines={numberOfLines} style={[baseStyle, styles.quoteText, onDark && styles.quoteTextOnDark]}>{renderInline(block.content, color, onDark)}</Text>
            </View>
          );
        }
        if (block.type === 'code') {
          return (
            <View key={key} style={styles.codeBlock}>
              {block.language ? <Text style={styles.codeLanguage}>{block.language.toUpperCase()}</Text> : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text selectable style={styles.codeText}>{block.content}</Text>
              </ScrollView>
            </View>
          );
        }
        return (
          <Text key={key} numberOfLines={numberOfLines} style={[baseStyle, styles.block]}>
            {renderInline(block.content, color, onDark)}
          </Text>
        );
      })}
    </View>
  );
}

const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  web: 'ui-monospace, SFMono-Regular, Consolas, monospace',
  default: 'monospace',
});

const styles = StyleSheet.create({
  container: { width: '100%', gap: spacing.sm },
  compact: { gap: spacing.xs },
  block: { flexShrink: 1 },
  bold: { fontFamily: fonts.bold },
  italic: { fontStyle: 'italic' },
  strike: { textDecorationLine: 'line-through' },
  link: { color: colors.blue, textDecorationLine: 'underline', fontFamily: fonts.semibold },
  linkOnDark: { color: colors.mint },
  inlineCode: { backgroundColor: colors.cream, fontFamily: monoFont, fontSize: 12 },
  list: { gap: spacing.xs },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', paddingRight: spacing.sm },
  marker: { width: 24, color: colors.green, fontFamily: fonts.bold },
  markerOnDark: { color: colors.mint },
  listText: { flex: 1 },
  quote: { borderLeftWidth: 3, borderLeftColor: colors.green, paddingLeft: spacing.md, paddingVertical: spacing.xs },
  quoteOnDark: { borderLeftColor: colors.mint },
  quoteText: { color: colors.muted, fontStyle: 'italic' },
  quoteTextOnDark: { color: colors.mint },
  codeBlock: { backgroundColor: colors.ink, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  codeLanguage: { color: colors.mint, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.8 },
  codeText: { color: colors.white, fontFamily: monoFont, fontSize: 12, lineHeight: 18 },
});
