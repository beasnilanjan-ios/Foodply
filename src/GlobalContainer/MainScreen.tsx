import React from 'react';

import Dashboard from '../Screens/Dashboard';
import DrawerScreenContainer from './DrawerScreenContainer';

export default function MainScreen({ navigation }: any) {
  return (
    <DrawerScreenContainer navigation={navigation}>
      {drawerNavigation => (
        <Dashboard navigation={drawerNavigation} />
      )}
    </DrawerScreenContainer>
  );
}
