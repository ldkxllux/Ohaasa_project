import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Keyboard, Share, Modal, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking } from 'react-native';

export default function App() {
  const [Month, setMonth] = useState('');
  const [Day, setDay] = useState('');
  const [userZodiac, setUserZodiac] = useState(null); // 사용자의 별자리 정보
  const [myFortune, setMyFortune] = useState(null);   // 서버에서 찾은 내 운세 데이터
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // 생일 저장 여부
  const [allFortunes, setAllFortunes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  // 본인 IP로 수정 필수!
  const API_URL = 'http://192.168.35.46:3000/fortune'; 

  // 앱 켜자마자 한 번 실행 -> 저장된 생일 있는지 확인
  useEffect(() => {
    checkSavedBirthday();
  }, []);

  // 저장된 생일 불러오기
  async function checkSavedBirthday() {
    try {
      const is_saved = await AsyncStorage.getItem('userZodiac');

      if (is_saved) {
        setUserZodiac(is_saved);
        setIsSaved(true);
        fetchMyFortune(is_saved); // 바로 운세 가지러 감
      }
    } catch (e) {
      console.error("불러오기 실패", e);
    }
  };

  // 별자리 계산기
  function calculateZodiac(month, day) {
    const m = parseInt(month);
    const d = parseInt(day);

    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "양자리";
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "황소자리";
    if ((m === 5 && d >= 21) || (m === 6 && d <= 21)) return "쌍둥이자리";
    if ((m === 6 && d >= 22) || (m === 7 && d <= 22)) return "게자리";
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "사자자리";
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "처녀자리";
    if ((m === 9 && d >= 23) || (m === 10 && d <= 23)) return "천칭자리";
    if ((m === 10 && d >= 24) || (m === 11 && d <= 22)) return "전갈자리";
    if ((m === 11 && d >= 23) || (m === 12 && d <= 21)) return "사수자리";
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "염소자리";
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "물병자리";
    return "물고기자리";
  };

  // 버튼 눌렀을 때 실행
  async function handleSave() {
    if (!Month || !Day) {
      Alert.alert("입력 오류", "월과 일을 모두 입력해주세요!");
      return;
    }
    
    Keyboard.dismiss();
    const zodiacName = calculateZodiac(Month, Day);
    
    // 기기에 저장
    await AsyncStorage.setItem('userZodiac', zodiacName);
    
    setUserZodiac(zodiacName);
    setIsSaved(true);
    fetchMyFortune(zodiacName);
  };

  // 서버에서 내 운세 데이터 가져오기
  async function fetchMyFortune(userZodiac) {
    setLoading(true);

    try {
      const response = await fetch(API_URL);
      const json = await response.json();

      setAllFortunes(json);
      
      const target = json.find(item => item.name === userZodiac);
      
      if (target) {
        setMyFortune(target);
      }
    } catch (error) {
      Alert.alert("연결 실패", "서버가 켜져 있는지 확인해주세요!");
      console.error(error);
    }
    setLoading(false);
  };

  // 행운의 색상으로 유튜브 플레이리스트 열기
  function playMusic(color) {
    const query = `${color} playlist`;
    Linking.openURL(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
  };

  // 생일 다시 입력하기
  async function resetInfo() {
    await AsyncStorage.removeItem('userZodiac');

    setIsSaved(false);
    setMonth('');
    setDay('');
    setMyFortune(null);
  };

  // 운세 공유하기
  const onShare = async () => {
    try {
      const message = `[오하아사 오늘의 운세]\n\n🌟 ${myFortune.name} (${myFortune.rank}위)\n\n"${myFortune.content}"\n\n🎨 행운색: ${myFortune.luckyColor}\n🍀 행운템: ${myFortune.luckyItem}`;
      await Share.share({ message: message });
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  // ---------------- 화면 그리기 ----------------

  // 로딩 중일 때
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1A1A2E" />
        <Text style={{marginTop: 10}}>오늘의 운세를 분석 중입니다...🔮</Text>
      </View>
    );
  }

  // 생일 입력창 (저장된 게 없을 때 보이기)
  if (!isSaved) {
    return (
      <View style={styles.container}>
        <View style={styles.inputBox}>
          <Text style={styles.title}>생일을 입력해주세요</Text>
          <Text style={styles.subtitle}>오늘의 행운을 배달해 드릴게요!🍀</Text>
          
          <View style={styles.row}>
            <TextInput style={styles.input} placeholder="Month" keyboardType="number-pad" value={Month} onChangeText={setMonth} maxLength={2}/>
            <TextInput style={styles.input} placeholder="Day" keyboardType="number-pad" value={Day} onChangeText={setDay} maxLength={2}/>
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleSave}>
            <Text style={styles.btnText}>내 운세 보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 운세 결과 화면 (저장된 게 있을 때 바로 운세 보여주기)
  return (
    <View style={styles.resultContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌟 오늘의 오하아사</Text>
        <TouchableOpacity onPress={resetInfo}>
          <Text style={styles.resetText}>생일 다시 입력</Text>
        </TouchableOpacity>
      </View>

      {myFortune ? (
        <View style={styles.card}>
          <Text style={styles.zodiacTitle}>{myFortune.name}</Text>
          <View style={styles.rankBadge}>
            <Text style={styles.rankNum}>{myFortune.rank}위</Text>
          </View>

          <Text style={styles.content}>{myFortune.content}</Text>
          
          <View style={styles.luckyBox}>
            <View style={styles.luckyRow}>
              <Text style={styles.label}>🎨 행운의 색</Text>
              <Text style={styles.value}>{myFortune.luckyColor}</Text>
            </View>
            <View style={styles.luckyRow}>
              <Text style={styles.label}>🍀 행운의 열쇠</Text>
              <Text style={styles.value}>{myFortune.luckyItem}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.rankBtn} onPress={() => setModalVisible(true)}>            
            <Text style={styles.rankBtnText}>🏆 전체 별자리 순위 보기</Text>
          </TouchableOpacity>

          <View style={{height: 10}} />

          <TouchableOpacity style={styles.shareBtn} onPress={onShare}>            
            <Text style={styles.BtnText}>📤 친구에게 공유하기</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.musicBtn} onPress={() => playMusic(myFortune.luckyColor)}>            
            <Text style={styles.BtnText}>🎵 행운의 플레이리스트 듣기</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text>데이터를 불러오는 중...</Text>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>🏆 오늘의 랭킹</Text>
            
            <ScrollView style={{width: '100%'}}>
              {allFortunes.map((item, index) => (
                <View key={index} style={[
                  styles.rankItem, 
                  item.name === userZodiac && styles.myRankItem // 내 별자리는 특별하게 표시
                ]}>
                  <Text style={[styles.rankItemNum, item.rank <= 3 && {color:'#FFD700'}]}>
                    {item.rank}위
                  </Text>
                  <Text style={[styles.rankItemName, item.name === userZodiac && {fontWeight:'bold'}]}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeBtnText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // 입력 화면 스타일
  inputBox: { width: '80%', backgroundColor: 'white', padding: 30, borderRadius: 20, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color:'#333' },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, width: 100, borderRadius: 10, textAlign: 'center', fontSize: 18, backgroundColor:'#FAFAFA' },
  btn: { backgroundColor: '#1A1A2E', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, width:'100%', alignItems:'center' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

  // 결과 화면 스타일
  resultContainer: { flex: 1, backgroundColor: '#1A1A2E', alignItems: 'center', justifyContent: 'center' },
  header: { position: 'absolute', top: 60, width: '100%', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  resetText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textDecorationLine:'underline' },

  card: { width: '85%', backgroundColor: 'white', borderRadius: 25, padding: 30, alignItems: 'center', shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  zodiacTitle: { fontSize: 28, fontWeight: '900', color: '#333', marginBottom: 10 },
  rankBadge: { backgroundColor: '#FFD700', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginBottom: 20 },
  rankNum: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  content: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  
  luckyBox: { width: '100%', backgroundColor: '#F5F5F5', borderRadius: 15, padding: 20, marginBottom: 20 },
  luckyRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#888', fontWeight: 'bold' },
  value: { color: '#333', fontWeight: 'bold' },

  shareBtn: { backgroundColor: '#4A90E2', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10},
  musicBtn: { backgroundColor: '#555', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  BtnText: { color: 'white', fontWeight: 'bold' },

  rankBtn: { backgroundColor: '#F0F0F0', width: '100%', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth:1, borderColor:'#ddd' },
  rankBtnText: { color: '#333', fontWeight: 'bold' },

  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: { width: '80%', height: '60%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, color:'#333' },
  
  rankItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee', width:'100%' },
  myRankItem: { backgroundColor: '#F0F8FF', borderRadius: 10, paddingHorizontal: 10, borderBottomWidth:0 }, // 내 별자리는 살짝 파란 배경
  
  rankItemNum: { fontSize: 18, fontWeight: 'bold', width: 50, color:'#555' },
  rankItemName: { fontSize: 16, color: '#333', marginRight: 5 },
  
  closeBtn: { marginTop: 20, padding: 10 },
  closeBtnText: { color: '#1A1A2E', fontWeight: 'bold', fontSize: 16 }

});
