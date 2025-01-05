import { Stack } from "expo-router";

export default function Profile(){
    return <Stack screenOptions={{
        headerShown:false
    }}>
        <Stack.Screen name="index" options={{
            animation:"fade_from_bottom",
        }}/>
        <Stack.Screen name="appinfo" options={{
            animation:"fade",
        }}/>
        <Stack.Screen name="edit" options={{
            animation:"fade",
        }}/>
    </Stack>
}