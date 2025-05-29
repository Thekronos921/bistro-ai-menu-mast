
import { useAuth } from '@/contexts/AuthContext';

export const useRestaurant = () => {
  const { userProfile } = useAuth();
  
  const getRestaurantId = () => {
    if (!userProfile?.restaurant_id) {
      throw new Error('Restaurant ID not found. User must be logged in and associated with a restaurant.');
    }
    return userProfile.restaurant_id;
  };

  const withRestaurantId = <T extends Record<string, any>>(data: T): T & { restaurant_id: string } => {
    return {
      ...data,
      restaurant_id: getRestaurantId()
    };
  };

  return {
    restaurantId: userProfile?.restaurant_id,
    getRestaurantId,
    withRestaurantId
  };
};
