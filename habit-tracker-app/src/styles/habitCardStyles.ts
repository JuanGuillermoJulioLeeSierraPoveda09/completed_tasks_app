import { StyleSheet } from 'react-native';
import { FONTS } from '../../fonts';

export const cardStyles = StyleSheet.create({
  habitInfo: { flex: 1, marginLeft: 12 },
  habitTitleCompleted: { textDecorationLine: 'line-through', color: '#6B7280' },
  habitDescription: { fontSize: 12, fontFamily: FONTS.regular, color: '#6B7280', marginTop: 2 },
  swipeableContainer: {
    marginBottom: 10,
    borderRadius: 16,
    justifyContent: 'center',
  },
  habitCardGestural: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  habitCardCompletedGestural: {
    backgroundColor: '#F9FAFB',
    borderColor: '#F3F4F6',
    elevation: 0,
    shadowOpacity: 0,
  },
  iconContainerGesture: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitTitleGestural: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#1F2937'
  },
  streakBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  streakBadgeMiniText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FONTS.extraBold,
  },
});
