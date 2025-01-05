import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Info, LogOut } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuthentication';
import { UserDetailsData } from '../auth/details';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { router } from 'expo-router';
import { Menu, MenuOption, MenuOptions, MenuTrigger } from 'react-native-popup-menu';

type NutritionProfile = {
  activity_level: string;
  age: number;
  allergies: boolean;
  calories: string;
  carbs: string;
  created_at: string; // ISO date string
  dietary_restrictions: boolean;
  fat: string;
  foodType: string;
  gender: string;
  goal: string;
  height: string;
  id: number;
  other_allergies: string[];
  protein: string;
  selected_allergies: string[];
  selected_restrictions: string[];
  updated_at: string; // ISO date string
  user_id: number;
  weight: string;
};


interface InfoItemProps {
  label: string;
  value: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value }) => (
  <View style={styles.infoItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const ListItem: React.FC<{ label: string; items: string[] }> = ({ label, items }) => (
  <View style={styles.listItem}>
    <Text style={styles.infoLabel}>{label}</Text>
    <View style={styles.tagContainer}>
      {items.map((item, index) => (
        <View key={index} style={styles.tag}>
          <Text style={styles.tagText}>{item}</Text>
        </View>
      ))}
    </View>
  </View>
);

export default function ProfilePage() {
  const {logout} = useAuth()
  const [profileData, setProfileData] = useState<NutritionProfile>()
  useEffect(()=>{
    const get_profile_data=async()=>{
      try{
      const _data = await AsyncStorage.getItem("nutrition_profile_data")
      if(!_data){
        throw Error("Cannot find data")
      }
      const data = JSON.parse(_data as string)
      if(!data.selected_allergies){
      data.selected_allergies = []
      }
      if(!data.selected_restrictions){
        data.selected_restrictions = []
      }
      if(!data.other_allergies){
        data.other_allergies = []
      }
      
      setProfileData(data)
      console.log("profile_data", data)
    }
    catch(err){
      console.log(err)
    }
    }
    get_profile_data()
  },[])
  return (
    <SafeAreaView style={styles.container}>
      
      <StatusBar style="light" />
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >

        <Animated.View 
          entering={FadeInDown.duration(1000).springify()}
          style={styles.contentContainer}
        >
        <View className='flex-row gap-3 mb-4 self-end'>
          <Menu style={{
            borderRadius:10,
          }}>
            <MenuTrigger>
            <Info
              // onPress={()=>{
              //   router.push("/profile/appinfo")
              // }}
              size={24}
              color={'black'}
            />
            </MenuTrigger>
                <MenuOptions customStyles={{
                  optionsContainer:{
                    borderRadius:4,
                    padding:"4%"
                  },
                  optionText:{
                    fontSize:18,
                  },
                  optionWrapper:{
                    padding:"2%"
                  }
                }}>
              <MenuOption onSelect={() => router.push("/profile/appinfo")} text='About' />
              <MenuOption onSelect={() => router.push("/profile/edit")} text='Profile Options' />
            </MenuOptions>
            </Menu>
            <LogOut
                size={24}
                onPress={()=>{
                  Alert.alert("Logout","Are you sure you want to logout?", [
                    {
                      onPress:()=>logout(),
                      text: "Logout"
                    },
                    {
                      text:"Cancel",
                      
                    }
                  ])
                }}
                color={"black"}
            />
        </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <InfoItem label="Age" value={`${profileData?.age} years`} />
            <InfoItem label="Height" value={`${profileData?.height} cm`} />
            <InfoItem label="Weight" value={`${profileData?.weight} kg`} />
            <InfoItem label="Gender" value={`${profileData?.gender}`} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Information</Text>
            <ListItem label="Dietary Restrictions" items={!profileData?.selected_restrictions?["No dietary restrictions"]:profileData?.selected_restrictions.length<=0?["No dietary restrictions"]:profileData?.selected_restrictions} />
            <ListItem label="Allergies" items={!profileData?.selected_allergies?["No dietary restrictions"]:profileData?.selected_allergies.length<=0?["No dietary restrictions"]:profileData?.selected_allergies} />
            <ListItem label="Other Allergies" items={!profileData?.other_allergies?["No dietary restrictions"]:profileData?.other_allergies.length<=0?["No dietary restrictions"]:profileData?.other_allergies} />

          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Information</Text>
            <InfoItem label="Activity Level" value={`${profileData?.activity_level}`} />
            <InfoItem label="Goal" value={`${profileData?.goal}`} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Macros Intake</Text>
            <InfoItem label="Calories" value={`${profileData?.calories} cal`} />
            <InfoItem label="Protein" value={`${profileData?.protein}g`} />
            <InfoItem label="Carbs" value={`${profileData?.carbs}g`} />
            <InfoItem label="Fats" value={`${profileData?.fat}g`} />
          </View>

          <View style={styles.section}>
          <Text style={styles.sectionTitle}>Food Intake</Text>
          <Text style={styles.infoLabel}>
              {profileData?.foodType}
          </Text>
          </View>
        </Animated.View>
      </ScrollView>
      {!profileData && <LoadingOverlay
        message='Wait...'
      />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  headerImage: {
    height: 300,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    padding: 24,
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  location: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 2,
  },
  memberInfo: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  settingsButton: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

