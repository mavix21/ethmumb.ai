"use client";

import { Compass, MapPin, Star, TrendingUp } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@myapp/ui/components/avatar";
import { Badge } from "@myapp/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@myapp/ui/components/card";

interface DiscoverItem {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  rating: number;
  location: string;
  trending?: boolean;
}

const discoverItems: DiscoverItem[] = [
  {
    id: "1",
    title: "Digital Art Gallery",
    description: "Explore the latest NFT collections from top artists",
    category: "Art",
    imageUrl: "https://picsum.photos/seed/art1/200",
    rating: 4.8,
    location: "Global",
    trending: true,
  },
  {
    id: "2",
    title: "DeFi Protocols",
    description: "Discover new decentralized finance opportunities",
    category: "Finance",
    imageUrl: "https://picsum.photos/seed/defi/200",
    rating: 4.5,
    location: "Ethereum",
  },
  {
    id: "3",
    title: "Gaming Guilds",
    description: "Join play-to-earn gaming communities",
    category: "Gaming",
    imageUrl: "https://picsum.photos/seed/gaming/200",
    rating: 4.7,
    location: "Multichain",
    trending: true,
  },
  {
    id: "4",
    title: "Music NFTs",
    description: "Support your favorite artists with music collectibles",
    category: "Music",
    imageUrl: "https://picsum.photos/seed/music/200",
    rating: 4.3,
    location: "Base",
  },
  {
    id: "5",
    title: "Virtual Real Estate",
    description: "Invest in metaverse land and properties",
    category: "Metaverse",
    imageUrl: "https://picsum.photos/seed/meta/200",
    rating: 4.1,
    location: "Decentraland",
  },
];

function DiscoverCard({ item }: { item: DiscoverItem }) {
  return (
    <Card className="overflow-hidden pt-0 transition-shadow hover:shadow-lg">
      <div className="relative h-32 w-full">
        <Avatar className="h-full w-full rounded-none">
          <AvatarImage
            src={item.imageUrl}
            alt={item.title}
            className="object-cover"
          />
          <AvatarFallback className="rounded-none">
            <Compass className="text-muted-foreground size-8" />
          </AvatarFallback>
        </Avatar>
        {item.trending && (
          <Badge className="absolute top-2 right-2 gap-1">
            <TrendingUp className="size-3" />
            Trending
          </Badge>
        )}
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{item.title}</CardTitle>
            <Badge variant="outline" className="mt-1">
              {item.category}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-yellow-400 text-yellow-400" />
            {item.rating}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="line-clamp-2">
          {item.description}
        </CardDescription>
        <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
          <MapPin className="size-3" />
          {item.location}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DiscoverPage() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-6 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
        <p className="text-muted-foreground">
          Explore new collections, communities, and opportunities
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {discoverItems.map((item) => (
          <DiscoverCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
