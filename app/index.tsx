import React, { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { useNutritionProfile } from '@/hooks/useNutrition'
import { View, Text, ActivityIndicator } from 'react-native'
import { LoadingOverlay } from '@/components/LoadingOverlay'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useAuthStore from '@/store/useAuthStore'
import useUserProfileStore from '@/store/useProfileStore'

export default function Index() {
  const {response} = useAuthStore()
  const { getNutritionProfile } = useNutritionProfile()
  const {profile} = useUserProfileStore()

  if (!response) {
    return <Redirect href="/auth" />
  }

  return <Redirect href={!(profile == null) ? "/food" : "/auth/details"} />
}

