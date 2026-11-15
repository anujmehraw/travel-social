
export type Post = {
  id: number;
  author: string;
  handle: string;
  location: string;
  time: string;
  title: string;
  content: string;
  image: string;
  likes: number;
  comments: number;
  category: string;
};

export type Community = {
  id: number;
  slug: string;
  name: string;
  city: string;
  members: string;
  description: string;
  image: string;
};

export const posts: Post[] = [
  {
    id: 1,
    author: "Riya Sharma",
    handle: "riyatravels",
    location: "Upper Lake, Bhopal",
    time: "2 hours ago",
    title: "A quiet evening by the lake",
    content:
      "Sometimes the best plans are no plans at all. Walked around Upper Lake just before sunset, and the view was incredible.",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
    likes: 124,
    comments: 18,
    category: "Local discovery",
  },
  {
    id: 2,
    author: "Arjun Verma",
    handle: "arjunontheroad",
    location: "Manali, Himachal Pradesh",
    time: "5 hours ago",
    title: "A weekend in the mountains",
    content:
      "Sharing my three-day itinerary, transport costs, and a few quieter spots worth visiting if you want to avoid the crowds.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=85",
    likes: 89,
    comments: 24,
    category: "Travel guide",
  },
  {
    id: 3,
    author: "Meera Kapoor",
    handle: "meeraexplores",
    location: "Jaipur, Rajasthan",
    time: "Yesterday",
    title: "The old streets of Jaipur",
    content:
      "Spent the morning exploring local markets and small cafés. Here are a few places I would recommend to anyone visiting for the first time.",
    image: "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=85",
    likes: 203,
    comments: 31,
    category: "City stories",
  },
];

export const communities: Community[] = [
  {
    id: 1,
    slug: "bhopal-community",
    name: "Bhopal Community",
    city: "Bhopal, Madhya Pradesh",
    members: "2.4k",
    description: "Discover local places, hidden cafés, lakes, and weekend plans.",
    image: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 2,
    slug: "delhi-travelers",
    name: "Delhi Travelers",
    city: "Delhi, India",
    members: "8.1k",
    description: "Explore the capital through local experiences and food.",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 3,  
    slug: "mountain-explorers",
    name: "Mountain Explorers",
    city: "Himachal Pradesh",
    members: "5.7k",
    description: "Trekking routes, mountain stays, and practical travel tips.",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=85",
  },
  {
    id: 4,
    slug: "weekend-explorers",
    name: "Weekend Explorers",
    city: "Across India",
    members: "3.6k",
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
 