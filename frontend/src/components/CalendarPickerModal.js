import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable as TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, fonts, radius, shadow } from '../theme';
import AppText from './AppText';
import AppIcon from './AppIcon';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatLocalDate(year, month, day) {
  const y = String(year);
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateStr(str) {
  if (!str || typeof str !== 'string') return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return { year: y, month: m, day: d };
}

export default function CalendarPickerModal({
  visible,
  onClose,
  onSelectDate,
  selectedDate,
  minDate,
  maxDate,
  startDate, // For highlighting range when picking end date
  title = 'Select Date',
  mode = 'start', // 'start' | 'end'
}) {
  const todayStr = useMemo(() => getTodayStr(), []);
  const effectiveMinDate = minDate || (mode === 'start' ? todayStr : (startDate || todayStr));

  // Calendar view navigation
  const [viewYear, setViewYear] = useState(() => {
    const parsed = parseDateStr(selectedDate) || parseDateStr(effectiveMinDate);
    return parsed ? parsed.year : new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    const parsed = parseDateStr(selectedDate) || parseDateStr(effectiveMinDate);
    return parsed ? parsed.month : new Date().getMonth() + 1;
  });

  const [tempSelected, setTempSelected] = useState(selectedDate || '');
  const [modalError, setModalError] = useState('');

  // Update view when modal opens or selectedDate changes
  useEffect(() => {
    if (visible) {
      setModalError('');
      const base = parseDateStr(selectedDate) || parseDateStr(effectiveMinDate);
      if (base) {
        setViewYear(base.year);
        setViewMonth(base.month);
      }
      setTempSelected(selectedDate || '');
    }
  }, [visible, selectedDate, effectiveMinDate]);

  // Compute days in current view month
  const { blanks, daysInMonth, daysCount } = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 = Sun
    const totalDays = new Date(viewYear, viewMonth, 0).getDate();
    const blanksArr = Array.from({ length: firstDayIndex }, (_, i) => i);
    const daysArr = Array.from({ length: totalDays }, (_, i) => i + 1);
    return { blanks: blanksArr, daysInMonth: daysArr, daysCount: totalDays };
  }, [viewYear, viewMonth]);

  function handlePrevMonth() {
    setModalError('');
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    setModalError('');
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayPress(dayNum) {
    const dateStr = formatLocalDate(viewYear, viewMonth, dayNum);

    // Validate against past / minDate
    if (effectiveMinDate && dateStr < effectiveMinDate) {
      if (mode === 'start') {
        setModalError(`Cannot select past date: ${dateStr}. Start date must be today (${todayStr}) or later.`);
      } else {
        setModalError(`End date (${dateStr}) cannot be earlier than start date (${effectiveMinDate}).`);
      }
      return;
    }

    if (maxDate && dateStr > maxDate) {
      setModalError(`Date exceeds maximum allowed limit (${maxDate}).`);
      return;
    }

    // Valid date selected
    setModalError('');
    setTempSelected(dateStr);
    onSelectDate(dateStr);
    onClose();
  }

  function handleQuickPreset(offsetDays) {
    let base = new Date();
    if (mode === 'end' && startDate) {
      const p = parseDateStr(startDate);
      if (p) {
        base = new Date(p.year, p.month - 1, p.day);
      }
    }
    base.setDate(base.getDate() + offsetDays);

    const year = base.getFullYear();
    const month = base.getMonth() + 1;
    const day = base.getDate();
    const dateStr = formatLocalDate(year, month, day);

    if (effectiveMinDate && dateStr < effectiveMinDate) {
      setModalError(`Selected preset is before minimum allowed date (${effectiveMinDate}).`);
      return;
    }

    setModalError('');
    setTempSelected(dateStr);
    onSelectDate(dateStr);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIconWrap}>
                <AppIcon name="calendar" size={20} color={colors.forest} />
              </View>
              <View>
                <AppText style={styles.modalTitle}>{title}</AppText>
                <AppText style={styles.modalSubtitle}>
                  {mode === 'start'
                    ? 'Select your trip departure date'
                    : `Must be on or after ${startDate || 'start date'}`}
                </AppText>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close calendar"
              accessibilityRole="button"
            >
              <AppIcon name="close" size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {/* Error Banner inside modal */}
          {modalError ? (
            <View style={styles.errorBox}>
              <AppIcon name="alert-circle" size={18} color="#b43b36" />
              <AppText style={styles.errorText}>{modalError}</AppText>
            </View>
          ) : null}

          {/* Month / Year Navigator */}
          <View style={styles.navigatorRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={styles.navArrowBtn}
              accessibilityLabel="Previous Month"
              accessibilityRole="button"
            >
              <AppIcon name="chevron-back" size={20} color={colors.forest} />
            </TouchableOpacity>

            <AppText style={styles.monthYearText}>
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </AppText>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={styles.navArrowBtn}
              accessibilityLabel="Next Month"
              accessibilityRole="button"
            >
              <AppIcon name="chevron-forward" size={20} color={colors.forest} />
            </TouchableOpacity>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((dayName, idx) => (
              <View key={dayName} style={styles.weekdayCell}>
                <AppText
                  style={[
                    styles.weekdayText,
                    (idx === 0 || idx === 6) && styles.weekendText,
                  ]}
                >
                  {dayName}
                </AppText>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {blanks.map((b) => (
              <View key={`blank-${b}`} style={styles.dayCell} />
            ))}

            {daysInMonth.map((dayNum) => {
              const cellDateStr = formatLocalDate(viewYear, viewMonth, dayNum);
              const isPast = effectiveMinDate && cellDateStr < effectiveMinDate;
              const isSelected = tempSelected === cellDateStr;
              const isToday = todayStr === cellDateStr;
              const isStartAnchor = startDate && cellDateStr === startDate;
              const isInRange =
                mode === 'end' &&
                startDate &&
                tempSelected &&
                cellDateStr >= startDate &&
                cellDateStr <= tempSelected;

              return (
                <TouchableOpacity
                  key={`day-${dayNum}`}
                  style={[
                    styles.dayCell,
                    isInRange && !isSelected && !isStartAnchor && styles.dayCellInRange,
                    isToday && !isSelected && styles.dayCellToday,
                    isStartAnchor && mode === 'end' && styles.dayCellStartAnchor,
                    isSelected && styles.dayCellSelected,
                    isPast && styles.dayCellDisabled,
                  ]}
                  onPress={() => handleDayPress(dayNum)}
                  accessibilityRole="button"
                  accessibilityLabel={`${dayNum} ${MONTH_NAMES[viewMonth - 1]} ${viewYear}`}
                >
                  <AppText
                    style={[
                      styles.dayText,
                      isToday && !isSelected && styles.dayTextToday,
                      isStartAnchor && mode === 'end' && styles.dayTextStartAnchor,
                      isSelected && styles.dayTextSelected,
                      isPast && styles.dayTextDisabled,
                    ]}
                  >
                    {dayNum}
                  </AppText>
                  {isToday && !isSelected && <View style={styles.todayDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend / Status Info */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.forest }]} />
              <AppText style={styles.legendText}>Selected</AppText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.green }]} />
              <AppText style={styles.legendText}>Today</AppText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#e0e0e0' }]} />
              <AppText style={styles.legendText}>Unavailable/Past</AppText>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
              accessibilityRole="button"
            >
              <AppText style={styles.cancelBtnText}>Cancel</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (tempSelected) {
                  onSelectDate(tempSelected);
                  onClose();
                } else {
                  setModalError('Please pick a date first.');
                }
              }}
              style={[
                styles.confirmBtn,
                !tempSelected && styles.confirmBtnDisabled,
              ]}
              accessibilityRole="button"
            >
              <AppText style={styles.confirmBtnText}>
                {tempSelected ? `Confirm (${tempSelected})` : 'Select Date'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 35, 22, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    padding: 20,
    ...shadow,
    borderWidth: 1,
    borderColor: '#e2ece6',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fdeeed',
    borderWidth: 1,
    borderColor: '#f5c2c0',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: '#b43b36',
    flex: 1,
    lineHeight: 16,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#edf5f0',
    borderWidth: 1,
    borderColor: '#d2e7db',
  },
  presetChipText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.forest,
  },
  navigatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f7faf8',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0ece5',
  },
  monthYearText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.forest,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  weekdayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.muted,
  },
  weekendText: {
    color: '#9e7b30',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
    borderRadius: 20,
    position: 'relative',
  },
  dayCellDisabled: {
    opacity: 0.3,
    backgroundColor: '#fafafa',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.green,
  },
  dayCellStartAnchor: {
    borderWidth: 1.5,
    borderColor: colors.forest,
    backgroundColor: '#e6f3ec',
  },
  dayCellInRange: {
    backgroundColor: '#eef8f2',
    borderRadius: 6,
  },
  dayCellSelected: {
    backgroundColor: colors.forest,
  },
  dayText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.ink,
  },
  dayTextToday: {
    color: colors.green,
    fontFamily: fonts.bold,
  },
  dayTextStartAnchor: {
    color: colors.forest,
    fontFamily: fonts.bold,
  },
  dayTextSelected: {
    color: '#ffffff',
    fontFamily: fonts.bold,
  },
  dayTextDisabled: {
    color: '#a0a0a0',
  },
  todayDot: {
    position: 'absolute',
    bottom: 3,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.green,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f3f1',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.muted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: '#f1f5f3',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.muted,
  },
  confirmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    backgroundColor: colors.forest,
  },
  confirmBtnDisabled: {
    backgroundColor: '#a3beaf',
  },
  confirmBtnText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: '#ffffff',
  },
});
