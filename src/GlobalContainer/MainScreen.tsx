import React, { useState } from 'react';

import Dashboard from '../Screens/Dashboard';
import DrawerScreenContainer from './DrawerScreenContainer';

export default function MainScreen({ navigation }: any) {
  return (
    <DrawerScreenContainer navigation={navigation}>
      {drawerNavigation => (
        <Dashboard
          navigation={drawerNavigation}
          onMenuPress={() => drawerNavigation.openDrawer?.()}
        />
      )}
    </DrawerScreenContainer>
  );
}
