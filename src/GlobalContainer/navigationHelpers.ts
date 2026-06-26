import { NavigationProp, ParamListBase } from '@react-navigation/native';

export function goBackToDashboard(navigation: NavigationProp<ParamListBase>) {
  const state = navigation.getState?.();

  if (state) {
    const dashboardIndex = state.routes.findIndex(
      route => route.name === 'Dashboard',
    );

    if (dashboardIndex >= 0 && state.index > dashboardIndex) {
      navigation.pop(state.index - dashboardIndex);
      return;
    }
  }

  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }

  navigation.reset({
    index: 0,
    routes: [{ name: 'Dashboard' }],
  });
}
