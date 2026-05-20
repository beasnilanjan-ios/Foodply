import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, ActivityIndicator, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SplashScreen from './src/Screens/SplashScreen';
import Banner from './src/Screens/Banner';
import Login from './src/Screens/Login';
import MainScreen from './src/GlobalContainer/MainScreen';
import Orders from './src/Screens/Orders';
import ViewAll from './src/Screens/ViewAll';
import GlobalLoginAuth from './src/GlobalContainer/GlobalLoginAuth'; // ✅ ADD THIS

export type RootStackParamList = {
  Splash: undefined;
  Banner: undefined;
  Login: undefined;
  Dashboard: { fromTab?: boolean } | undefined;
  Orders: { fromTab?: boolean } | undefined;
  ViewAll: undefined;
};

enableScreens();

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  // ✅ CHECK TOKEN ON APP START
  useEffect(() => {
    const checkAuth = async () => {
      try {
        await GlobalLoginAuth.loadAuthData();

        if (GlobalLoginAuth.accessToken) {
          setInitialRoute('Dashboard'); // ✅ go directly to dashboard
        } else {
          setInitialRoute('Banner'); // ✅ normal flow
         // setInitialRoute('Dashboard');
        }
      } catch (error) {
        console.log('Auth check error:', error);
        setInitialRoute('Banner');
      }
    };

    checkAuth();
  }, []);

  // ✅ SHOW LOADER UNTIL DECIDED
  if (!initialRoute) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute} // ✅ DYNAMIC ROUTE
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} />

          <Stack.Screen
            name="Banner"
            component={Banner}
            options={{ animation: 'none' }}
          />

          <Stack.Screen name="Login" component={Login} />

          <Stack.Screen
            name="Dashboard"
            component={MainScreen}
            options={({ route }) => ({
              animation: route.params?.fromTab ? 'none' : 'default',
            })}
          />

          <Stack.Screen
            name="Orders"
            component={Orders}
            options={({ route }) => ({
              animation: route.params?.fromTab ? 'none' : 'default',
            })}
            
          />
          <Stack.Screen
            name="ViewAll"
            component={ViewAll}
            options={{ animation: 'none' }}
           
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
// new change
export default App;
