import { Clock, Share2 } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@myapp/ui/components/avatar";
import { Badge } from "@myapp/ui/components/badge";
import { Button } from "@myapp/ui/components/button";
import { Separator } from "@myapp/ui/components/separator";

interface ArticleContentProps {
  dismissButton?: React.ReactNode;
}

export function ArticleContent({ dismissButton }: ArticleContentProps) {
  return (
    <article className="relative">
      {/* Hero Image */}
      <div className="from-primary/20 via-primary/10 to-secondary relative h-56 w-full bg-linear-to-br">
        <div className="absolute inset-0 bg-[url('/sphere.svg')] bg-center bg-no-repeat opacity-20" />
      </div>

      {dismissButton}

      <div className="px-4 py-6">
        <div className="mx-auto max-w-lg space-y-6">
          {/* Article Header */}
          <header className="space-y-4">
            <Badge variant="secondary">Architecture</Badge>

            <h1 className="text-foreground text-2xl leading-tight font-bold">
              The Rise of Minimalism: How Modern Architecture is Redefining
              Space
            </h1>

            <p className="text-muted-foreground">
              Exploring how minimalism in architecture is transforming the way
              we design, live, and interact with spaces.
            </p>

            {/* Author & Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarImage src="https://i.pravatar.cc/150?u=frederik" />
                  <AvatarFallback>FH</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-foreground text-sm font-medium">
                    Frederik Hansen
                  </p>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Clock className="size-3" />
                    <span>5 min read</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <Share2 className="size-4" />
                <span className="sr-only">Share article</span>
              </Button>
            </div>
          </header>

          <Separator />

          {/* Article Body */}
          <div className="prose prose-sm text-foreground/90 max-w-none space-y-4">
            <p>
              Minimalism in architecture has evolved far beyond a simple design
              trend. Today, it is a defining philosophy that shapes how we
              conceive, create, and inhabit our spaces. The sleek lines, open
              plans, and functional designs that characterize minimalist
              architecture represent a shift toward a more intentional,
              thoughtful use of space.
            </p>

            <p>
              In its early stages, minimalism was driven by modernist
              principles, particularly those of the Bauhaus movement, which
              sought to eliminate ornamentation and focus on functional beauty.
              Architects like Ludwig Mies van der Rohe, with his famous aphorism
              &quot;Less is more,&quot; laid the groundwork for the minimalist
              approach we recognize today.
            </p>

            <blockquote className="border-primary text-muted-foreground border-l-4 pl-4 italic">
              &quot;Less is more&quot; — Ludwig Mies van der Rohe
            </blockquote>

            <p>
              One of the key drivers behind the rise of minimalism is the desire
              for more efficient use of space. As cities become more crowded,
              space is at a premium, and the need to design smaller but more
              functional homes and offices is becoming increasingly important.
            </p>

            <p>
              Incorporating natural light and clean lines is another hallmark of
              minimalist design. These elements help to create a sense of peace
              and serenity, which is central to the minimalist philosophy. Large
              windows, often floor-to-ceiling, invite the outdoors in,
              connecting occupants with nature and enhancing the feeling of
              openness.
            </p>

            <p>
              The minimalist approach also encourages mindfulness in how we
              interact with our surroundings. In a world filled with
              distractions, minimalist spaces offer a reprieve—an opportunity to
              live more consciously.
            </p>

            <p>
              Finally, minimalist architecture is not just about visual
              aesthetics—it is a tool for enhancing the quality of life. The
              rise of minimalism reflects a growing recognition that our built
              environments have a profound impact on our well-being.
            </p>
          </div>

          {/* Article Footer */}
          <Separator />

          <footer className="flex flex-wrap gap-2">
            <Badge variant="outline">Design</Badge>
            <Badge variant="outline">Architecture</Badge>
            <Badge variant="outline">Minimalism</Badge>
            <Badge variant="outline">Modern Living</Badge>
          </footer>
        </div>
      </div>
    </article>
  );
}
