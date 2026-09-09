import React, {useState, useEffect, useMemo} from 'react';
import{
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather} from '@expo/vector-icons';

interface DayItem{
  day: string;
  date: number;
  fullDate: Date;
}

interface Habit{
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

type HabitLogs = Record<string, string[]>;
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

const formatDateKey = (date: Date) =>{
  const year = date.getFullYear();
  const month = String(date.getMonth()+1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App(){
  const {daysOfWeek, todayIndex} = useCurrentWeek();
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [headerDateText, setHeaderDateText] = useState<string>('');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLogs>({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isStreaksModalVisible, setIsStreaksModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [currentCalendarDate, setCurrentCalendarDate] = useState('');

  useEffect(() => {
    setSelectedDay(todayIndex);
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', {weekday: 'short'});
    const monthName = today.toLocaleDateString('en-US', {month: 'short'});
    const dayNum = today.getDate();
    setHeaderDateText(`Today ${dayName}, ${monthName} ${dayNum}`);
  }, [todayIndex]);

  const activeDate = useMemo(() =>{
    return daysOfWeek[selectedDay]?.fullDate || new Date();
  }, [daysOfWeek, selectedDay]);
  const activeDateKey = useMemo(() => formatDateKey(activeDate), [activeDate]);
  const toggleHabitCompletion = (habitId: string) =>{
    setHabitLogs((prevLogs) =>{
      const currentCompleted = prevLogs[activeDateKey] || [];
      const exists = currentCompleted.includes(habitId);
      const updated = exists
        ? currentCompleted.filter((id) => id !== habitId)
        : [...currentCompleted, habitId];
      return{
        ...prevLogs,
        [activeDateKey]: updated,
      };
    });
  };

  const handleCreateHabit = () => {
    if (!newTitle.trim()) return;
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDescription,
      icon: 'checkmark-circle-outline',
      color: '#4F46E6',
    };

    setHabits([...habits, newHabit]);
    setNewTitle('');
    setNewDescription('');
    setIsModalVisible(false);
  };

  const handleSelectedCalendarDay = (dayNumber: number) => {
    const foundIndex = daysOfWeek.findIndex((item) => item.date === dayNumber);
    if (foundIndex !== -1){
      setSelectedDay(foundIndex);
    }
    setIsStreaksModalVisible(false);
  };

  return(
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.dateSelector} onPress={() => setIsStreaksModalVisible(true)}>
          <Text style={styles.dateText}>{headerDateText}</Text>
          <Ionicons name="chevron-down" size={18} color="#1F2937"/>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        <View style={styles.daysContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {daysOfWeek.map((item, index) => {
              const isSelected = index === selectedDay;
              return(
                <TouchableOpacity
                  key={index}
                  style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                  onPress={() => setSelectedDay(index)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {item.day}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberSelected]}>
                    {item.date}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.habitsSection}>
          <Text style={styles.sectionTitle}>Your Habits</Text>
          {habits.length === 0 ? (
            <View style={styles.habitsSection}>
              <Text style={styles.emptyText}>You don't have any habits yet</Text>
              <Text style={styles.emptySubtext}>Create one to start your tracking</Text>
            </View>
          ) : (
            habits.map((habit) => (
              <View key={habit.id} style={styles.habitCard}>
                <View style={[styles.iconContainer, {backgroundColor: habit.color + '20'}]}>
                  <Ionicons name={habit.icon as any} size={24} color={habit.color} />
                </View>

                <View style={styles.habitInfo}>
                  <Text style={styles.habitTitle}>{habit.title}</Text>
                  <Text style={styles.habitDescription}>{habit.description}</Text>
                </View>

                <TouchableOpacity style={styles.optionsButton}>
                  <Feather name="more-vertical" size={20} color="#9CA3AF"/>
                </TouchableOpacity>
              </View>
            ))
          )}
          <TouchableOpacity style={styles.createHabitButton} onPress={() => setIsModalVisible(true)}>
            <Ionicons name="add-circle-outline" size={22} color="#4F46E5"/>
            <Text style={styles.createHabitText}>Creat a new habit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="grid-outline" size={22} color="#4F46E5"/>
          <Text style={[styles.bottomTabText, {color: '#4F46E5'}]}>Menú</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTab} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add-circle" size={22} color="#6B7280"/>
          <Text style={styles.bottomTabText}>New Habit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="bar-chart-outline" size={22} color="#6B7280"/>
          <Text style={styles.bottomTabText}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="person-outline" size={22} color="#6B7280"/>
          <Text style={styles.bottomTabText}>Me</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create A New Habit</Text>
            <TextInput 
              style={styles.input}
              placeholder="Habit name"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <Text style={styles.modalSubtitle}>
              Description
            </Text>
            <TextInput 
              style={styles.input}
              placeholder=""
              value={newDescription}
              onChangeText={setNewDescription}
            />
            <View style={styles.modalButton}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleCreateHabit}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isStreaksModalVisible} animationType='slide' transparent={false}>
        <SafeAreaView style={styles.streaksContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#121212"/>
          <View style={styles.streaksHeader}>
            <TouchableOpacity onPress={() => setIsStreaksModalVisible(false)}>
              <Ionicons name="close" size={28} color="#FFFFFF"/>
            </TouchableOpacity>
            <Text style={styles.streaksTitle}>My Streaks</Text>
            <View style={{width: 28}}/>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.streaksRow}>
              {/*Logged Days*/}
              <View style={styles.streakCard}>
                <Ionicons name="flame" size={56} color="#F59E0B"/>
                <Text style={styles.streakLabel}>Logged Days</Text>
                <Text style={[styles.streakNumber, {color: '#F59E0B'}]}>0</Text>
                <Text style={styles.streakSubtext}>current streak</Text>
                <View style={styles.bestBadge}>
                  <Ionicons name="trophy-outline" size={16} color="#D59E0B"/>
                  <Text style={styles.bestText}>Best: </Text>
                </View>
              </View>
              {/*Perfect Days*/}
              <View style={styles.streakCard}>
                <Ionicons name="flame" size={56} color="#10B981" />
                <Text style={styles.streakLabel}>Perfect Days</Text>
                <Text style={[styles.streakNumber, {color: '#10B981'}]}></Text>
                <Text style={styles.streakSubtext}>current streak</Text>
                <View style={styles.bestBadge}>
                  <Ionicons  name="trophy-outline" size={16} color="#10B981"/>
                  <Text style={styles.bestText}>Best: </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor: '#F9FAFB'},
  navbar:{
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dateSelector: {flexDirection: 'row', alignItems: 'center', gap: 4},
  dateText: {fontSize: 16, fontWeight: '700', color: '#1F2937'},
  navRight: {flexDirection: 'row', alignItems: 'center', gap: 12},
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  streakText: {fontWeight: '700', color: '#EF4444'},
  iconButton: {padding: 4},
  mainContent: {flex: 1},
  daysContainer: {paddingVertical: 16, paddingHorizontal: 8},
  dayCard:{
    width: 45,
    height: 65,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal:4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dayCardSelected: {backgroundColor: '#4F46E5', borderColor: '#4F46E5'},
  dayText: {fontSize: 12, color: '#6B7280', marginBottom: 4},
  dayTextSelected: {color: '#FFFFFF'},
  dateNumber: {fontSize: 16, fontWeight: '700', color: '#1F2937'},
  dateNumberSelected: {color: '#FFFFFF'},
  habitsSection: {paddingHorizontal: 16},
  sectionTitle: {fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12},
  emptyContainer:{
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  emptyText: {color: '#4B5563', fontWeight: '600', fontSize: 14},
  emptySubtext: {color: '#9CA3AF', fontSize: 12, marginTop: 4},
  habitCard:{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer:{
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitInfo: {flex: 1, marginLeft: 12},
  habitTitle: {fontSize: 15, fontWeight: '600', color: '#1F2937'},
  habitDescription: {fontSize: 12, color: '#6B7280', marginTop:2},
  optionsButton: {padding: 6},
  createHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    borderStyle: 'dashed',
    marginTop: 8,
    gap: 8,
  },
  createHabitText: {color: '#4F46E5', fontWeight: '600', fontSize: 15},
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bottomTab: {alignItems: 'center'},
  bottomTabText: {fontSize: 11, color: '#6B7280', marginTop: 2},

  modalOverlay:{
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent:{
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {fontSize: 18, fontWeight: '700', marginBottom: 16, color: '#1F2937'},
  modalSubtitle: {fontSize: 14, fontWeight: '700', marginBottom:10, color: '#3b3b3b'},
  input: {
    borderWidth: 1,
    borderColor: '#D1D5D8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
  },
  modalButtons: {flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8},
  modalButton: {paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8},
  cancelButton: {backgroundColor: '#F3F4F6'},
  cancelButtonText: {color: '#4B5563', fontWeight: '600'},
  saveButton: {backgroundColor: '#4F46E5'},
  saveButtonText: {color: '#FFFFFF', fontWeight: '600'},
  streaksContainer: {flex: 1, backgroundColor: '#121212'},
  streaksHeader:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  streaksTitle: {fontSize: 20, fontWeight: '700', color: '#FFFFFF'},
  streaksRow:{
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  streakCard: {alignItems: 'center', flex: 1},
  streakLabel: {fontSize: 16, fontWeight: '600', color: '#FFFFFF', marginTop: 8},
  streakNumber: {fontSize: 36, fontWeight: '800', marginVertical: 2},
  streakSubtext: {fontSize: 13, color: '#9CA3AF', marginBottom: 12},
  bestBadge: {flexDirection: 'row', alignItems: 'center', gap: 6},
  bestText: {color: '#E5E7EB', fontWeight: '600', fontSize: 14},
});