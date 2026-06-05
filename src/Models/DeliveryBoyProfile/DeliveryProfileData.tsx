import {DeliveryProfile} from '../../Models/DeliveryBoyProfile/DeliveryProfile';
import {DeliveryStats} from '../../Models/DeliveryBoyProfile/DeliveryStats';
import {PersonalDetails} from '../../Models/DeliveryBoyProfile/PersonalDetails';
import {VehicleDetails} from '../../Models/DeliveryBoyProfile/VehicleDetails';

export interface DeliveryProfileData {
  profile: DeliveryProfile;
  stats: DeliveryStats;
  personalDetails: PersonalDetails;
  vehicle: VehicleDetails;
}