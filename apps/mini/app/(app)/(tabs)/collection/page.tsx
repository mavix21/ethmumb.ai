"use client";

import { useState } from "react";
import { Grid3X3, List, Sparkles, Tag } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@myapp/ui/components/avatar";
import { Badge } from "@myapp/ui/components/badge";
import { Button } from "@myapp/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@myapp/ui/components/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@myapp/ui/components/tabs";

interface CollectionItem {
  id: string;
  name: string;
  collection: string;
  imageUrl: string;
  price: string;
  rarity: "common" | "rare" | "legendary";
  tokenId: string;
  acquiredDate: string;
}

const collectionItems: CollectionItem[] = [
  {
    id: "1",
    name: "Cosmic Voyager #142",
    collection: "Cosmic Series",
    imageUrl: "https://picsum.photos/seed/nft1/300",
    price: "0.5 ETH",
    rarity: "legendary",
    tokenId: "#142",
    acquiredDate: "Nov 2024",
  },
  {
    id: "2",
    name: "Digital Dreams #89",
    collection: "Dreams Collection",
    imageUrl: "https://picsum.photos/seed/nft2/300",
    price: "0.15 ETH",
    rarity: "rare",
    tokenId: "#89",
    acquiredDate: "Oct 2024",
  },
  {
    id: "3",
    name: "Pixel Art #456",
    collection: "Pixel Universe",
    imageUrl: "https://picsum.photos/seed/nft3/300",
    price: "0.08 ETH",
    rarity: "common",
    tokenId: "#456",
    acquiredDate: "Sep 2024",
  },
  {
    id: "4",
    name: "Abstract Mind #23",
    collection: "Abstract Art",
    imageUrl: "https://picsum.photos/seed/nft4/300",
    price: "0.32 ETH",
    rarity: "rare",
    tokenId: "#23",
    acquiredDate: "Aug 2024",
  },
  {
    id: "5",
    name: "Nature Spirit #77",
    collection: "Nature Spirits",
    imageUrl: "https://picsum.photos/seed/nft5/300",
    price: "1.2 ETH",
    rarity: "legendary",
    tokenId: "#77",
    acquiredDate: "Jul 2024",
  },
  {
    id: "6",
    name: "Cyber Punk #321",
    collection: "Cyber World",
    imageUrl: "https://picsum.photos/seed/nft6/300",
    price: "0.05 ETH",
    rarity: "common",
    tokenId: "#321",
    acquiredDate: "Jun 2024",
  },
];

function getRarityBadge(rarity: CollectionItem["rarity"]) {
  switch (rarity) {
    case "legendary":
      return (
        <Badge className="bg-linear-to-r from-yellow-500 to-orange-500 text-white">
          <Sparkles className="mr-1 size-3" />
          Legendary
        </Badge>
      );
    case "rare":
      return <Badge variant="secondary">Rare</Badge>;
    default:
      return <Badge variant="outline">Common</Badge>;
  }
}

function CollectionCard({ item }: { item: CollectionItem }) {
  return (
    <Card className="group overflow-hidden pt-0 transition-all hover:shadow-lg">
      <div className="relative aspect-square w-full overflow-hidden">
        <Avatar className="h-full w-full rounded-none">
          <AvatarImage
            src={item.imageUrl}
            alt={item.name}
            className="object-cover transition-transform group-hover:scale-105"
          />
          <AvatarFallback className="rounded-none">
            <Sparkles className="text-muted-foreground size-8" />
          </AvatarFallback>
        </Avatar>
        <div className="absolute top-2 right-2">
          {getRarityBadge(item.rarity)}
        </div>
      </div>
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="line-clamp-1 text-base">{item.name}</CardTitle>
        <CardDescription className="text-xs">{item.collection}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Tag className="text-muted-foreground size-3" />
            <span className="text-sm font-medium">{item.price}</span>
          </div>
          <span className="text-muted-foreground text-xs">
            {item.acquiredDate}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function CollectionListItem({ item }: { item: CollectionItem }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-3">
        <Avatar className="size-16 rounded-lg">
          <AvatarImage src={item.imageUrl} alt={item.name} />
          <AvatarFallback className="rounded-lg">
            <Sparkles className="text-muted-foreground size-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.name}</span>
            {getRarityBadge(item.rarity)}
          </div>
          <p className="text-muted-foreground text-sm">{item.collection}</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-medium">{item.price}</span>
            <span className="text-muted-foreground">{item.tokenId}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CollectionPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const totalValue = "2.3 ETH";
  const itemCount = collectionItems.length;

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">My Collection</h1>
        <p className="text-muted-foreground">
          {itemCount} items • Est. value: {totalValue}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="legendary">Legendary</TabsTrigger>
              <TabsTrigger value="rare">Rare</TabsTrigger>
            </TabsList>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="size-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="size-4" />
              </Button>
            </div>
          </div>

          <TabsContent value="all" className="mt-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {collectionItems.map((item) => (
                  <CollectionCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {collectionItems.map((item) => (
                  <CollectionListItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="legendary" className="mt-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {collectionItems
                  .filter((item) => item.rarity === "legendary")
                  .map((item) => (
                    <CollectionCard key={item.id} item={item} />
                  ))}
              </div>
            ) : (
              <div className="space-y-3">
                {collectionItems
                  .filter((item) => item.rarity === "legendary")
                  .map((item) => (
                    <CollectionListItem key={item.id} item={item} />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rare" className="mt-4">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {collectionItems
                  .filter((item) => item.rarity === "rare")
                  .map((item) => (
                    <CollectionCard key={item.id} item={item} />
                  ))}
              </div>
            ) : (
              <div className="space-y-3">
                {collectionItems
                  .filter((item) => item.rarity === "rare")
                  .map((item) => (
                    <CollectionListItem key={item.id} item={item} />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
