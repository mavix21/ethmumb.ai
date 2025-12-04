"use client";

import { Crown, MessageCircle, Shield, Users, Verified } from "lucide-react";

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
  CardTitle,
} from "@myapp/ui/components/card";

interface CommunityMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: "admin" | "moderator" | "member";
  verified?: boolean;
  joinedDate: string;
}

interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  imageUrl: string;
  category: string;
  isJoined: boolean;
}

const featuredMembers: CommunityMember[] = [
  {
    id: "1",
    name: "Alex Chen",
    username: "@alexchen",
    avatar: "https://picsum.photos/seed/user1/100",
    role: "admin",
    verified: true,
    joinedDate: "Jan 2023",
  },
  {
    id: "2",
    name: "Sarah Miller",
    username: "@sarahm",
    avatar: "https://picsum.photos/seed/user2/100",
    role: "moderator",
    verified: true,
    joinedDate: "Mar 2023",
  },
  {
    id: "3",
    name: "James Wilson",
    username: "@jwilson",
    avatar: "https://picsum.photos/seed/user3/100",
    role: "member",
    joinedDate: "Jun 2023",
  },
  {
    id: "4",
    name: "Emily Davis",
    username: "@emilyd",
    avatar: "https://picsum.photos/seed/user4/100",
    role: "member",
    verified: true,
    joinedDate: "Aug 2023",
  },
];

const communities: Community[] = [
  {
    id: "1",
    name: "NFT Collectors",
    description: "A community for NFT enthusiasts and collectors",
    memberCount: 12500,
    imageUrl: "https://picsum.photos/seed/nft/100",
    category: "Art",
    isJoined: true,
  },
  {
    id: "2",
    name: "DeFi Developers",
    description: "Share knowledge and build the future of finance",
    memberCount: 8300,
    imageUrl: "https://picsum.photos/seed/dev/100",
    category: "Development",
    isJoined: false,
  },
  {
    id: "3",
    name: "Base Builders",
    description: "Building on Base blockchain together",
    memberCount: 5600,
    imageUrl: "https://picsum.photos/seed/base/100",
    category: "Blockchain",
    isJoined: true,
  },
];

function getRoleBadge(role: CommunityMember["role"]) {
  switch (role) {
    case "admin":
      return (
        <Badge variant="destructive" className="gap-1">
          <Crown className="size-3" />
          Admin
        </Badge>
      );
    case "moderator":
      return (
        <Badge variant="secondary" className="gap-1">
          <Shield className="size-3" />
          Mod
        </Badge>
      );
    default:
      return null;
  }
}

function MemberCard({ member }: { member: CommunityMember }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="size-12">
          <AvatarImage src={member.avatar} alt={member.name} />
          <AvatarFallback>{member.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{member.name}</span>
            {member.verified && (
              <Verified className="size-4 fill-blue-500 text-white" />
            )}
          </div>
          <p className="text-muted-foreground text-sm">{member.username}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {getRoleBadge(member.role)}
          <span className="text-muted-foreground text-xs">
            {member.joinedDate}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function CommunityCard({ community }: { community: Community }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="size-14 rounded-xl">
          <AvatarImage src={community.imageUrl} alt={community.name} />
          <AvatarFallback className="rounded-xl">
            <Users className="text-muted-foreground size-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <CardTitle className="text-base">{community.name}</CardTitle>
          <CardDescription className="line-clamp-1">
            {community.description}
          </CardDescription>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Users className="size-3" />
            {community.memberCount.toLocaleString()} members
            <Badge variant="outline" className="text-xs">
              {community.category}
            </Badge>
          </div>
        </div>
        <Button variant={community.isJoined ? "outline" : "default"} size="sm">
          {community.isJoined ? "Joined" : "Join"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function CommunityPage() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-6 pb-24">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Community</h1>
        <p className="text-muted-foreground">
          Connect with like-minded people and join communities
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Communities</h2>
          <Button variant="ghost" size="sm">
            View all
          </Button>
        </div>
        <div className="space-y-3">
          {communities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured Members</h2>
          <Button variant="ghost" size="sm" className="gap-1">
            <MessageCircle className="size-4" />
            Chat
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {featuredMembers.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      </section>
    </div>
  );
}
