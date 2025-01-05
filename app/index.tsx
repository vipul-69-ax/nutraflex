import React, { useEffect, useState } from 'react'
import { Redirect } from 'expo-router'
import { useAuthState } from '@/hooks/useAuthentication'
import { useNutritionProfile } from '@/hooks/useNutrition'
import { View, Text, ActivityIndicator } from 'react-native'
import { LoadingOverlay } from '@/components/LoadingOverlay'

export default function Index() {
  const [isInitialized, setIsInitialized] = useState(false)
  const isAuthenticated = useAuthState()
  const { getNutritionProfile: nutritionData } = useNutritionProfile()

  useEffect(() => {
    if (isAuthenticated !== undefined && nutritionData !== undefined) {
      setIsInitialized(true)
    }
  }, [isAuthenticated, nutritionData])

  if (!isInitialized) {
    return (
      <LoadingOverlay
        message='Loading...'
      />
    )
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth" />
  }

  return <Redirect href={nutritionData ? "/food" : "/auth/details"} />
}

