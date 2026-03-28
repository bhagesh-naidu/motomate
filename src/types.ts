import { 
  Map as MapIcon, 
  Users, 
  User, 
  Search, 
  Plus, 
  Navigation, 
  AlertTriangle, 
  Share2, 
  MessageSquare, 
  Flashlight, 
  Bot, 
  SkipBack, 
  Play, 
  SkipForward, 
  Volume2,
  ChevronLeft,
  Trophy,
  Settings,
  Bike,
  Fuel,
  MapPin,
  Clock,
  Award,
  Calendar,
  LogOut,
  Pause,
  TrendingUp,
  X
} from 'lucide-react';

export type Screen = 'splash' | 'auth' | 'onboarding' | 'dashboard' | 'navigation' | 'community' | 'profile';

export interface RiderProfile {
  uid: string;
  name: string;
  bike: string;
  mileage: string;
  points: number;
  ridesCount: number;
  totalDistance: number;
  rank: string;
  memberSince: string;
}

export const MOCK_DESTINATIONS = [
  { id: 1, name: 'Lonavala Hills', distance: '89 km', time: '2h 15m', lat: 18.7546, lng: 73.4062 },
  { id: 2, name: 'Lavasa Lake', distance: '65 km', time: '1h 45m', lat: 18.4100, lng: 73.5000 },
  { id: 3, name: 'Mahabaleshwar', distance: '120 km', time: '3h 30m', lat: 17.9237, lng: 73.6586 },
  { id: 4, name: 'Matheran', distance: '80 km', time: '2h 30m', lat: 18.9894, lng: 73.2679 },
  { id: 5, name: 'Alibaug Beach', distance: '95 km', time: '3h 00m', lat: 18.6411, lng: 72.8722 },
];

export const MOCK_LEADERBOARD = [
  { id: 1, name: 'RoadKing_2026', rank: 'Legend', points: '24,567', initial: 'R' },
  { id: 2, name: 'HighwayHawk', rank: 'Pathfinder', points: '19,234', initial: 'H' },
  { id: 3, name: 'NightRider_X', rank: 'Pathfinder', points: '15,890', initial: 'N' },
  { id: 4, name: 'MountainMoto', rank: 'Scout', points: '12,456', initial: 'M' },
  { id: 5, name: 'CoastalCruiser', rank: 'Scout', points: '9,876', initial: 'C' },
];

export const MOCK_RIDERS = [
  { id: 1, name: 'Alex', bike: 'MT-09', distance: '0.8 km', status: 'Riding' },
  { id: 2, name: 'Sarah', bike: 'Z900', distance: '1.2 km', status: 'Riding' },
  { id: 3, name: 'Mike', bike: 'R1', distance: '2.5 km', status: 'Stopped' },
];

export interface Ride {
  id?: string;
  uid: string;
  destination: string;
  distance: number;
  duration: string;
  timestamp: any;
}

export interface Expense {
  id?: string;
  uid: string;
  type: 'Fuel' | 'Maintenance' | 'Gear' | 'Other';
  amount: number;
  date: any;
  note?: string;
}

export interface LiveRide {
  uid: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  status: string;
  destination: string;
  sharingWith: string[];
  lastUpdated: any;
}

export interface Friendship {
  id?: string;
  users: string[];
  status: 'pending' | 'accepted';
  createdAt: any;
}
