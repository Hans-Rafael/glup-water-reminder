import React, { useContext, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import DrinkContext from '../context/DrinkContext';
import { getTranslation } from '../utils/translations';

const HistorialScreen = () => {
  const ctx = useContext(DrinkContext);
  const fallback = { drinks: [] as any, deleteDrink: (_: number) => {}, dailyGoal: 2.5, language: 'es' };
  const { drinks, deleteDrink, dailyGoal, language } = ctx || fallback;
  const [currentPeriod, setCurrentPeriod] = useState('today');

  const generateWeeklyData = () => {
    const weekData = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayDrinks = drinks.filter(drink => {
        if (!drink.date) {
          return i === 0; // Solo incluir en el día de hoy si no tiene fecha
        }
        
        const drinkDate = new Date(drink.date);
        const isSameDay = drinkDate.getFullYear() === date.getFullYear() &&
                         drinkDate.getMonth() === date.getMonth() &&
                         drinkDate.getDate() === date.getDate();
        return isSameDay;
      });
      
      const dayTotal = dayDrinks.reduce((sum, drink) => sum + drink.amount, 0);
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      
      weekData.push({
        day: dayNames[date.getDay()],
        date: date.getDate(),
        consumed: dayTotal,
        percentage: Math.round((dayTotal / dailyGoal) * 100),
        achieved: dayTotal >= dailyGoal
      });
    }
    
    console.log('Weekly data generated:', weekData);
    return weekData;
  };

  const weeklyData = generateWeeklyData();
  const total = drinks.reduce((s, d) => s + d.amount, 0);
  const progressPercentage = Math.round((total / dailyGoal) * 100);

  const hourly = useMemo(() => {
    const arr = new Array(24).fill(0);
    drinks.forEach(d => { arr[d.hour] += d.amount; });
    return arr;
  }, [drinks]);

  const maxHourly = Math.max(...hourly, 0.1);
  const [chartInfo, setChartInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!chartInfo) return;
    const t = setTimeout(() => setChartInfo(null), 3000);
    return () => clearTimeout(t);
  }, [chartInfo]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{getTranslation('historial', language)}</Text>
      
      {/* Selector de período */}
      <View style={styles.periodSelector}>
        <TouchableOpacity 
          style={[styles.periodBtn, currentPeriod === 'today' && styles.periodBtnActive]}
          onPress={() => setCurrentPeriod('today')}
        >
          <Text style={[styles.periodBtnText, currentPeriod === 'today' && styles.periodBtnTextActive]}>
            {language === 'en' ? 'Today' : 'Hoy'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.periodBtn, currentPeriod === 'week' && styles.periodBtnActive]}
          onPress={() => setCurrentPeriod('week')}
        >
          <Text style={[styles.periodBtnText, currentPeriod === 'week' && styles.periodBtnTextActive]}>
            {language === 'en' ? 'Last week' : 'Última semana'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Resumen diario */}
      <View style={styles.dailySummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{language === 'en' ? 'Total consumed:' : 'Total consumido:'}</Text>
          <Text style={styles.summaryValue}>{total.toFixed(1)}L</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{language === 'en' ? 'Target:' : 'Meta:'}</Text>
          <Text style={styles.summaryValue}>{dailyGoal.toFixed(1)}L</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{language === 'en' ? 'Progress:' : 'Progreso:'}</Text>
          <Text style={styles.summaryValue}>{progressPercentage}%</Text>
        </View>
        <View style={[styles.goalStatus, total >= dailyGoal ? styles.goalAchieved : styles.goalPending]}>
          <Text style={[styles.goalStatusText, total >= dailyGoal ? styles.goalAchievedText : styles.goalPendingText]}>
            {total >= dailyGoal 
              ? (language === 'en' ? '🎉 Daily goal completed!' : '🎉 ¡Meta diaria completada!')
              : `🎯 ${language === 'en' ? 'You need' : 'Te faltan'} ${(dailyGoal - total).toFixed(1)}L ${language === 'en' ? 'to complete your goal' : 'para completar tu meta'}`
            }
          </Text>
        </View>
      </View>

      {/* Gráfico de horarios/semanal */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>
          {currentPeriod === 'today' 
            ? `📈 ${language === 'en' ? 'Hydration by hours' : 'Hidratación por horas'}`
            : `📈 ${language === 'en' ? 'Weekly progress' : 'Progreso semanal'}`
          }
        </Text>
        <View style={styles.chartContainer}>
          {currentPeriod === 'today' ? (
            // Vista diaria por horas
            hourly.map((v, i) => {
              const height = (v / maxHourly) * 100;
              const isGoalMet = total >= dailyGoal;
              return (
                <TouchableOpacity 
                  key={i} 
                  style={styles.chartColumnWrapper} 
                  onPress={() => setChartInfo(`${i}:00 — ${Math.round(v*1000)}ml`)}
                >
                  <View style={[
                    styles.chartColumn, 
                    { 
                      height: `${Math.max(4, height)}%`, 
                      backgroundColor: v > 0 ? (isGoalMet ? '#4CAF50' : '#2196F3') : '#e0e0e0'
                    }
                  ]} />
                </TouchableOpacity>
              );
            })
          ) : (
            // Vista semanal por días
            weeklyData.map((dayData, i) => {
              const height = Math.min((dayData.consumed / dailyGoal) * 100, 100);
              let barColor = '#e0e0e0';
              if (dayData.consumed > 0) {
                barColor = dayData.achieved ? '#4CAF50' : '#FF9800';
              }
              
              return (
                <TouchableOpacity 
                  key={i} 
                  style={styles.chartColumnWrapper} 
                  onPress={() => setChartInfo(`${dayData.day} ${dayData.date}: ${dayData.consumed.toFixed(1)}L - ${dayData.achieved ? '✓ Meta alcanzada' : dayData.percentage + '% completado'}`)}
                >
                  <View style={[
                    styles.chartColumn, 
                    { 
                      height: `${Math.max(4, height)}%`, 
                      backgroundColor: barColor
                    }
                  ]} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
        <View style={styles.chartLabels}>
          {currentPeriod === 'today' ? (
            <>
              <Text style={styles.chartLabel}>6AM</Text>
              <Text style={styles.chartLabel}>12PM</Text>
              <Text style={styles.chartLabel}>6PM</Text>
              <Text style={styles.chartLabel}>12AM</Text>
            </>
          ) : (
            weeklyData.map((d, i) => (
              <Text key={i} style={styles.chartLabel}>{d.day}</Text>
            ))
          )}
        </View>
        
        {currentPeriod === 'week' && (
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>{language === 'en' ? 'Goal achieved' : 'Meta alcanzada'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.legendText}>{language === 'en' ? 'Partial progress' : 'Progreso parcial'}</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#e0e0e0' }]} />
              <Text style={styles.legendText}>{language === 'en' ? 'No activity' : 'Sin actividad'}</Text>
            </View>
          </View>
        )}
      </View>

      {chartInfo && (
        <View style={styles.chartInfoBox}>
          <Text style={styles.chartInfoText}>{chartInfo}</Text>
        </View>
      )}

      {/* Lista de bebidas - solo en vista diaria */}
      {currentPeriod === 'today' && (
        <View style={styles.drinksSection}>
          <Text style={styles.drinksTitle}>
            🥤 {language === 'en' ? 'Recent drinks' : 'Últimas bebidas'}
          </Text>
          {drinks.length === 0 ? (
            <Text style={styles.noDrinks}>
              {language === 'en' ? "You haven't drunk water today. Start now!" : 'No has bebido agua hoy. ¡Comienza ahora!'}
            </Text>
          ) : (
            <FlatList 
              data={drinks.slice(0, 10)} 
              keyExtractor={i => `${i.id}`} 
              renderItem={({ item }) => (
                <View style={styles.drinkItem}>
                  <View style={styles.drinkInfo}>
                    <Text style={styles.drinkTime}>{item.time}</Text>
                    <Text style={styles.drinkAmount}>{Math.round(item.amount * 1000)}ml</Text>
                  </View>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteDrink(item.id)}>
                    <Text style={styles.deleteBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              scrollEnabled={false}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f0f8ff',
    padding: 15
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    textAlign: 'center',
    marginBottom: 15
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 3,
    marginBottom: 15
  },
  periodBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    alignItems: 'center'
  },
  periodBtnActive: {
    backgroundColor: '#2196F3'
  },
  periodBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666'
  },
  periodBtnTextActive: {
    color: 'white'
  },
  dailySummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  goalStatus: {
    textAlign: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8
  },
  goalAchieved: {
    backgroundColor: '#e8f5e8'
  },
  goalPending: {
    backgroundColor: '#fff3e0'
  },
  goalStatusText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  goalAchievedText: {
    color: '#4caf50'
  },
  goalPendingText: {
    color: '#ff9800'
  },
  chartSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center'
  },
  chartContainer: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 5,
    gap: 2
  },
  chartColumnWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end'
  },
  chartColumn: {
    width: '80%',
    borderRadius: 2,
    minHeight: 4
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  chartLabel: {
    fontSize: 10,
    color: '#666'
  },
  chartInfoBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  chartInfoText: {
    color: '#333',
    fontSize: 12
  },
  drinksSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  drinksTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  drinkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  drinkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  drinkTime: {
    fontSize: 12,
    color: '#666',
    minWidth: 45
  },
  drinkAmount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2196F3',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  deleteBtn: {
    backgroundColor: '#ff5722',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  deleteBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold'
  },
  noDrinks: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    padding: 20
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
    marginTop: 8
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 2
  },
  legendText: {
    fontSize: 10,
    color: '#666'
  }
});

export default HistorialScreen;
