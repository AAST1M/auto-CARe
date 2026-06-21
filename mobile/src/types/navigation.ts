import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  Home: undefined;
  WinchMap: undefined;
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;
