
export type Post = {
  id: string;
  author_id: string;
  content: string;
  location: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  saved_by_me: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type TravelRoom = {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  destination: string | null;
  start_location: string | null;
  departure_date: string | null;
  return_date: string | null;
  budget: number | null;
  max_members: number;
  category: string | null;
  cover_url: string | null;
  is_public: boolean;
  created_at: string;
  member_count?: number;
  can_view?: boolean;
  is_member?: boolean;
  has_pending_invitation?: boolean;
  is_creator?: boolean;
};

export type Community = {
  id: number | string;
  slug: string;
  name: string;
  city: string;
  description: string;
  image: string;
};

export type CommunityRecord = Omit<Community, "image"> & {
  creator_id: string;
  image_url: string | null;
  created_at: string;
};

export function toCommunity(record: CommunityRecord): Community {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    city: record.city,
    description: record.description,
    image: record.image_url ?? "",
  };
}

export const communities: Community[] = [
  {
    id: 1,
    slug: "bhopal-community",
    name: "Bhopal Community",
    city: "Bhopal, Madhya Pradesh",
    description: "Discover local places, hidden cafés, lakes, and weekend plans.",
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 2,
    slug: "delhi-travelers",
    name: "Delhi Travelers",
    city: "Delhi, India",
    description: "Explore the capital through local experiences and food.",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 3,  
    slug: "mountain-explorers",
    name: "Mountain Explorers",
    city: "Himachal Pradesh",
    description: "Trekking routes, mountain stays, and practical travel tips.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 4,
    slug: "weekend-explorers",
    name: "Weekend Explorers",
    city: "Across India",
    description: "Find short trips, travel companions, and nearby escapes.",
    image: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=900&q=85",
  },
];

export const destinations = [
  {
    name: "Manali",
    region: "Himachal Pradesh",
    image: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Jaipur",
    region: "Rajasthan",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Goa",
    region: "Western India",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Varanasi",
    region: "Uttar Pradesh",
    image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=85",
  },
];
 