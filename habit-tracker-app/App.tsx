import React, {useState, useEffect} from 'react';
import{
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { Ionicons, Feather, FontAwesome5} from '@expo/vector-icons';

interface DayItem{
  day: string;
  date: number;
  fullDate: Date;
}

export function useCurrentWeek(){
  const [daysOfWeek, setDaysOfWeek] = useState<DayItem[]>([]);
  const [todayIndex, setTodayIndex] = useState<number>(0);

  useEffect(() => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDayOfWeek);
    const week: DayItem[] = [];

    for (let i = 0; i<7; i++){
      const nextDay = new Date(startOfWeek);
      nextDay.setDate(startOfWeek.getDate() + i);
      week.push({
        day: nextDay.toLocaleDateString('en-US', {weekday: 'short'}),
        date: nextDay.getDate(),
        fullDate: nextDay,
      });
    }
    setDaysOfWeek(week);
    setTodayIndex(currentDayOfWeek);
  }, []);
  
  return {daysOfWeek, todayIndex};
}